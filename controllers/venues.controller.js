import db from '../db.js';
import { notFound } from '../utils/httpError.js';

const COLUMNS = 'venue_id, name, address, capacity, seat_map';

// Express 5 сам передаёт ошибки из async-функций в errorHandler,
// поэтому try/catch и обёртки не нужны.

export const getAll = async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Number(req.query.offset) || 0;

  const { rows } = await db.query(
    `SELECT ${COLUMNS} FROM venues ORDER BY venue_id LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  res.json(rows);
};

export const getById = async (req, res) => {
  const { rows } = await db.query(
    `SELECT ${COLUMNS} FROM venues WHERE venue_id = $1`,
    [req.params.id]
  );
  if (!rows.length) throw notFound('Площадка не найдена');
  res.json(rows[0]);
};

export const create = async (req, res) => {
  const { name, address, capacity, seat_map = null } = req.body;
  const { rows } = await db.query(
    `INSERT INTO venues (name, address, capacity, seat_map)
     VALUES ($1, $2, $3, $4)
     RETURNING ${COLUMNS}`,
    [name, address, capacity, seat_map]
  );
  res.status(201).json(rows[0]);
};

export const update = async (req, res) => {
  const { name, address, capacity, seat_map = null } = req.body;
  const { rows } = await db.query(
    `UPDATE venues
        SET name = $1, address = $2, capacity = $3, seat_map = $4
      WHERE venue_id = $5
      RETURNING ${COLUMNS}`,
    [name, address, capacity, seat_map, req.params.id]
  );
  if (!rows.length) throw notFound('Площадка не найдена');
  res.json(rows[0]);
};

export const remove = async (req, res) => {
  const { rowCount } = await db.query('DELETE FROM venues WHERE venue_id = $1', [req.params.id]);
  if (!rowCount) throw notFound('Площадка не найдена');
  res.status(204).send();
};
