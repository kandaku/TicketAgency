import db from '../db.js';
import { getPagination } from '../utils/query.js';

// Кириллические колонки переименовываем в английские ключи для JSON
const COLUMNS = `
  "id_Клиента"       AS customer_id,
  "ФИО"              AS full_name,
  "email"            AS email,
  "Телефон"          AS phone,
  "Дата_Регистрации" AS registered_at`;

export const getAll = async (req, res) => {
  const { limit, offset } = getPagination(req);
  const search = req.query.search ? `%${req.query.search}%` : null;

  const { rows } = await db.query(
    `SELECT ${COLUMNS}
       FROM "Клиент"
      WHERE ($1::text IS NULL OR "ФИО" ILIKE $1 OR "email" ILIKE $1)
      ORDER BY "id_Клиента"
      LIMIT $2 OFFSET $3`,
    [search, limit, offset]
  );
  res.json(rows);
};

export const getById = async (req, res) => {
  const { rows } = await db.query(
    `SELECT ${COLUMNS} FROM "Клиент" WHERE "id_Клиента" = $1`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Клиент не найден' });
  res.json(rows[0]);
};

export const create = async (req, res) => {
  const { full_name, email, phone = null } = req.body;

  const exists = await db.query(
    'SELECT 1 FROM "Клиент" WHERE lower("email") = lower($1)',
    [email]
  );
  if (exists.rowCount) return res.status(409).json({ error: 'Клиент с таким email уже существует' });

  const { rows } = await db.query(
    `INSERT INTO "Клиент" ("ФИО", "email", "Телефон", "Дата_Регистрации")
     VALUES ($1, $2, $3, NOW())
     RETURNING ${COLUMNS}`,
    [full_name, email, phone]
  );
  res.status(201).json(rows[0]);
};

export const update = async (req, res) => {
  const { full_name, email, phone = null } = req.body;

  const taken = await db.query(
    'SELECT 1 FROM "Клиент" WHERE lower("email") = lower($1) AND "id_Клиента" <> $2',
    [email, req.params.id]
  );
  if (taken.rowCount) {
    return res.status(409).json({ error: 'Этот email уже используется другим клиентом' });
  }

  const { rows } = await db.query(
    `UPDATE "Клиент"
        SET "ФИО" = $1, "email" = $2, "Телефон" = $3
      WHERE "id_Клиента" = $4
      RETURNING ${COLUMNS}`,
    [full_name, email, phone, req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Клиент не найден' });
  res.json(rows[0]);
};

export const remove = async (req, res) => {
  const orders = await db.query(
    'SELECT 1 FROM "Заказ" WHERE "id_Клиента" = $1 LIMIT 1',
    [req.params.id]
  );
  if (orders.rowCount) {
    return res.status(409).json({ error: 'Нельзя удалить клиента, у которого есть заказы' });
  }

  const { rowCount } = await db.query('DELETE FROM "Клиент" WHERE "id_Клиента" = $1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'Клиент не найден' });
  res.status(204).send();
};
