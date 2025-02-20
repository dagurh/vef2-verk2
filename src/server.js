import express from 'express';
import { router } from './routes.js';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const app = express();

app.use(express.urlencoded({ extended: true }));

const path = dirname(fileURLToPath(import.meta.url));

app.set('views', join(path, './views'));
app.set('view engine', 'ejs');

app.use('/', router, express.static('public'));

const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Server is running');
});

app.listen(port, () => {
  console.log(`Server running on port: ${port}/`);
});