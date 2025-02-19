import express from 'express';
import { query, categoriesFromDatabase, qAndAFromDatabase } from './lib/db.js';
import { environment } from './lib/environment.js';
import { Database } from './lib/db.client.js';
import { logger } from './lib/logger.js';

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
  res.render('form', { title: 'Búa til flokk', categories: categories });
});

router.post('/spurningar/:category', async (req, res) => {
  const userAnswers = req.body;
  const title = req.params.category;
  let results = {};

  const questions = await qAndAFromDatabase(title);

  for (const key in userAnswers) {
    const answerId = userAnswers[key];

    // Fetch the answer and check if it's correct
    const result = await query('SELECT question_id, is_correct FROM answers WHERE id = $1', [answerId]);

    if (result.rows.length > 0) {
      const { question_id, is_correct } = result.rows[0];

      // Store the correctness per question
      results[question_id] = {
        selectedAnswer: answerId,
        isCorrect: is_correct
      };
    }
  }

  // Fetch all correct answers for each question to ensure the right answer is always highlighted
  const correctAnswers = await query('SELECT question_id, id FROM answers WHERE is_correct = TRUE');

  correctAnswers.rows.forEach(row => {
    if (!results[row.question_id]) {
      results[row.question_id] = {};
    }
    results[row.question_id].correctAnswer = row.id;
  });

  res.render("category", { title, questions, results });
});

router.post('/form', async(req, res) => {
  const { category_id, new_category, question_text, answers, correct_answer } = req.body;

  // validation, what if name is empty?
  // what if sql injection? or something malicious?
  // what if name is too long?
  // TODO validate and mind security

  // if validation fails, render form again with error message
  // if validation passes, insert into database and redirect to index

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
});
