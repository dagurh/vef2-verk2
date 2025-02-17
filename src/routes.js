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
  res.render(`category`, { title, questions });
});

router.get('/form', (req, res) => {
  res.render('form', { title: 'Búa til flokk' });
});

router.post('/spurningar/:category', async (req, res) => {
  const answers = req.body;
  let score = 0;

  for (const key in answers) {
    const answerId = answers[key];
    const result = await query('SELECT is_correct FROM answers WHERE id = $1', [answerId]);

    if (result.rows[0].is_correct) {
      score++;
    }
  }

});

router.post('/form', async(req, res) => {
  const { name } = req.body;
  console.log('Name: ', name);

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

  const result = await db.query('INSERT INTO categories (name) VALUES ($1)', [name]);

  console.log('Result: ', result);

  res.render('form-created', { title: 'Flokkur búinn til' });
});
