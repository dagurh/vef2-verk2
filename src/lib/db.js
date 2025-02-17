import pg from 'pg';

const {
  DATABASE_URL: connectionString,
} = process.env;

if (!connectionString) {
  console.log("Missing DATABASE_URL from env");
  process.exit(1);
} else {
  console.info(connectionString);
}

const pool = new pg.Pool({ connectionString });

pool.on('error', (err) => {
  console.error('postgres error, exiting...', err);
  process.exit(-1);
});

export async function categoriesFromDatabase() {
  const result = await query('SELECT * FROM categories');

  if (result?.rowCount > 0) {
    return result.rows;
  }

  return null;
}

export async function qAndAFromDatabase(category) {
  //generated with help from chatGPT
  const queryText = `
    SELECT q.id AS question_id, q.question_text, a.id AS answer_id, a.answer_text, a.is_correct
    FROM questions q
    JOIN categories c ON q.category_id = c.id
    JOIN answers a ON q.id = a.question_id
    WHERE c.name = $1
    ORDER BY q.id, RANDOM();
  `;

  const result = await query(queryText, [category]);

  if (result?.rowCount > 0) {
    return result.rows;
  }

  return null;
}

export async function query(q, params = []) {
  let client;

  try {
    client = await pool.connect();
  } catch (e) {
    console.error('Unable to connect', e);
    return;
  }

  let result;
  try {
    result = await client.query(q, params);
  } catch (e) {
    console.error('Error selecting', e);
  } finally {
    client.release();
  }

  //await pool.end();

  return result;
}
