import express from 'express';
import { router } from './routes.js';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const app = express();

app.use(express.urlencoded({ extended: true }));

const path = dirname(fileURLToPath(import.meta.url));

app.set('views', join(path, './views'));
app.set('view engine', 'ejs');

app.use('/', router);

const hostname = '127.0.0.1';
const port = 3000;

app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});