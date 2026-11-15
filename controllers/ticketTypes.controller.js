import db from '../db.js';
import { getPagination, getOptionalId } from '../utils/query.js';

// Цену приводим к числу (иначе pg вернёт numeric строкой "1500.00")
const COLUMNS = `
  "id_Типа"        AS ticket_type_id,
  "Название"       AS name,
  "Цена"::float8   AS price,
  "id_Мероприятия" AS event_id`;

export const getAll = async (req, res) => {
  const { limit, offset } = getPagination(req);
  const eventId = getOptionalId(req, 'event_id');
  if (Number.isNaN(eventId)) {
    return res.status(400).json({ error: 'Параметр event_id должен быть положительным целым числом' });
  }

  const { rows } = await db.query(
    `SELECT ${COLUMNS}
       FROM "Тип_Билета"
      WHERE ($1::int IS NULL OR "id_Мероприятия" = $1)
      ORDER BY "id_Мероприятия", "id_Типа"
      LIMIT $2 OFFSET $3`,
    [eventId, limit, offset]
  );
  res.json(rows);
};

export const getById = async (req, res) => {
  const { rows } = await db.query(
    `SELECT ${COLUMNS} FROM "Тип_Билета" WHERE "id_Типа" = $1`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Тип билета не найден' });
  res.json(rows[0]);
};

export const create = async (req, res) => {
  const { name, price, event_id } = req.body;

  const event = await db.query('SELECT 1 FROM "Мероприятие" WHERE "id_Мероприятия" = $1', [event_id]);
  if (!event.rowCount) return res.status(400).json({ error: 'Мероприятие не найдено' });

  const { rows } = await db.query(
    `INSERT INTO "Тип_Билета" ("Название", "Цена", "id_Мероприятия")
     VALUES ($1, $2, $3)
     RETURNING ${COLUMNS}`,
    [name, price, event_id]
  );
  res.status(201).json(rows[0]);
};

// Мероприятие у типа билета менять нельзя, только название и цену
export const update = async (req, res) => {
  const { name, price } = req.body;
  const { rows } = await db.query(
    `UPDATE "Тип_Билета"
        SET "Название" = $1, "Цена" = $2
      WHERE "id_Типа" = $3
      RETURNING ${COLUMNS}`,
    [name, price, req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Тип билета не найден' });
  res.json(rows[0]);
};

export const remove = async (req, res) => {
  const tickets = await db.query('SELECT 1 FROM "Билет" WHERE "id_Типа" = $1 LIMIT 1', [req.params.id]);
  if (tickets.rowCount) {
    return res.status(409).json({ error: 'Нельзя удалить тип билета, по которому есть билеты' });
  }

  const { rowCount } = await db.query('DELETE FROM "Тип_Билета" WHERE "id_Типа" = $1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'Тип билета не найден' });
  res.status(204).send();
};
