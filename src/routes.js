import express from 'express';
import { query, categoriesFromDatabase, qAndAFromDatabase } from './lib/db.js';
import { environment } from './lib/environment.js';
import { Database } from './lib/db.client.js';
import { logger } from './lib/logger.js';
import { body, validationResult } from 'express-validator';

export const router = express.Router();

router.get('/', async(req, res) => {
  const categories = await categoriesFromDatabase();
  res.render('index', { title: 'Forsíða', categories });
});

router.get('/spurningar/:category', async (req, res) => {
  // TEMP EKKI READY FOR PROD
  const title = req.params.category;
  const questions = await qAndAFromDatabase(title);

  res.render(`category`, { title, questions, results: {} });
});

router.get('/form', async (req, res) => {
  const categories = await categoriesFromDatabase();
  res.render('form', { title: 'Búa til flokk', categories: categories, errors: [] });
});

router.post('/form', 
  [
    body('new_category')
      .optional()
      .trim()
      .isLength({ max: 30 })
      .withMessage('Nýr flokkur verður að vera minna en 30 stafir'),
    body('question_text')
      .trim()
      .isLength({ min: 10, max: 250 })
      .withMessage('Spurning verður að vera 10 til 250 stafir'),
    body('answers')
      .isArray({ min: 2, max: 6 })
      .withMessage('Þarf að vera að minnsta kosti tveir svar valmöguleikar og í mesta lagi 6'),
  ],
  async(req, res) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.status(400).render('form', {
        title: "Villa kom upp",
        errors: errors.array(),
        categories: [],
      });
    }

    const { category_id, new_category, question_text, answers, correct_answer } = req.body;

    const env = environment(process.env, logger);
    if (!env) {
      process.exit(1);
    }

    const db = new Database(env.connectionString, logger);
    db.open();

    let categoryId = category_id;

    // If user added a new category
    if (new_category && new_category.trim() !== "") {
      const newCatRes = await db.query(
        "INSERT INTO categories (name) VALUES ($1) RETURNING id",
        [new_category.trim()]
      );
      categoryId = newCatRes.rows[0].id;
    }

    // Insert Question
    const questionRes = await db.query(
      "INSERT INTO questions (category_id, question_text) VALUES ($1, $2) RETURNING id",
      [categoryId, question_text]
    );
    const questionId = questionRes.rows[0].id;

    // Insert Answers
    for (let i = 0; i < answers.length; i++) {
      await db.query(
        "INSERT INTO answers (question_id, answer_text, is_correct) VALUES ($1, $2, $3)",
        [questionId, answers[i], i == correct_answer]
      );
    }

    res.render('question-created', { title: 'Spurning búinn til' });
  }
);
