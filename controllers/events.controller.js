import db from '../db.js';
import { getPagination, getOptionalId } from '../utils/query.js';

// Мероприятие вместе с названием площадки (JOIN)
const SELECT_EVENT = `
  SELECT e."id_Мероприятия" AS event_id,
         e."Название"       AS name,
         e."Дата"           AS event_date,
         e."id_Площадки"    AS venue_id,
         v."Название"       AS venue_name
    FROM "Мероприятие" e
    JOIN "Площадка" v ON v."id_Площадки" = e."id_Площадки"`;

async function findEvent(id) {
  const { rows } = await db.query(`${SELECT_EVENT} WHERE e."id_Мероприятия" = $1`, [id]);
  return rows[0];
}

async function venueExists(venueId) {
  const { rowCount } = await db.query('SELECT 1 FROM "Площадка" WHERE "id_Площадки" = $1', [venueId]);
  return rowCount > 0;
}

export const getAll = async (req, res) => {
  const { limit, offset } = getPagination(req);
  const venueId = getOptionalId(req, 'venue_id');
  if (Number.isNaN(venueId)) {
    return res.status(400).json({ error: 'Параметр venue_id должен быть положительным целым числом' });
  }
  const upcoming = req.query.upcoming === 'true';

  const { rows } = await db.query(
    `${SELECT_EVENT}
      WHERE ($1::int IS NULL OR e."id_Площадки" = $1)
        AND ($2::boolean = false OR e."Дата" >= NOW())
      ORDER BY e."Дата", e."id_Мероприятия"
      LIMIT $3 OFFSET $4`,
    [venueId, upcoming, limit, offset]
  );
  res.json(rows);
};

export const getById = async (req, res) => {
  const event = await findEvent(req.params.id);
  if (!event) return res.status(404).json({ error: 'Мероприятие не найдено' });
  res.json(event);
};

export const create = async (req, res) => {
  const { name, event_date, venue_id } = req.body;
  if (!(await venueExists(venue_id))) return res.status(400).json({ error: 'Площадка не найдена' });

  const { rows } = await db.query(
    `INSERT INTO "Мероприятие" ("Название", "Дата", "id_Площадки")
     VALUES ($1, $2, $3)
     RETURNING "id_Мероприятия" AS event_id`,
    [name, event_date, venue_id]
  );
  res.status(201).json(await findEvent(rows[0].event_id));
};

export const update = async (req, res) => {
  const { name, event_date, venue_id } = req.body;

  const current = await findEvent(req.params.id);
  if (!current) return res.status(404).json({ error: 'Мероприятие не найдено' });

  if (venue_id !== current.venue_id) {
    if (!(await venueExists(venue_id))) return res.status(400).json({ error: 'Площадка не найдена' });

    const tickets = await db.query(
      'SELECT 1 FROM "Билет" WHERE "id_Мероприятия" = $1 LIMIT 1',
      [req.params.id]
    );
    if (tickets.rowCount) {
      return res.status(409).json({ error: 'Нельзя сменить площадку: на мероприятие уже есть билеты' });
    }
  }

  await db.query(
    `UPDATE "Мероприятие"
        SET "Название" = $1, "Дата" = $2, "id_Площадки" = $3
      WHERE "id_Мероприятия" = $4`,
    [name, event_date, venue_id, req.params.id]
  );
  res.json(await findEvent(req.params.id));
};

export const remove = async (req, res) => {
  const { rows } = await db.query(
    `SELECT (SELECT COUNT(*) FROM "Билет"      WHERE "id_Мероприятия" = $1)::int AS tickets,
            (SELECT COUNT(*) FROM "Тип_Билета" WHERE "id_Мероприятия" = $1)::int AS ticket_types`,
    [req.params.id]
  );
  if (rows[0].tickets > 0) {
    return res.status(409).json({ error: 'Нельзя удалить мероприятие: на него есть билеты' });
  }
  if (rows[0].ticket_types > 0) {
    return res.status(409).json({ error: 'Сначала удалите типы билетов этого мероприятия' });
  }

  const { rowCount } = await db.query('DELETE FROM "Мероприятие" WHERE "id_Мероприятия" = $1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'Мероприятие не найдено' });
  res.status(204).send();
};
