import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import db from '../db.js';

// В ES-модулях нет __dirname, получаем его из import.meta.url
const __dirname = path.dirname(fileURLToPath(import.meta.url));

try {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8');
  await db.query(sql);
  console.log('Схема БД успешно применена');
} catch (err) {
  console.error('Ошибка применения схемы:', err.message);
  process.exitCode = 1;
} finally {
  await db.pool.end();
}
