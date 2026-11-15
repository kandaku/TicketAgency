import db from '../db.js';
import { getPagination, getOptionalId } from '../utils/query.js';
import { TICKET_STATUS } from '../utils/statuses.js';

const COLUMNS = `
  "id_Места"    AS seat_id,
  "id_Площадки" AS venue_id,
  "Ряд"         AS row_number,
  "Номер"       AS seat_number,
  "Тип_Места"   AS seat_type`;

// Результат бизнес-ошибки внутри транзакции: { error: { status, message } }
const fail = (status, message) => ({ error: { status, message } });

/**
 * Выполняет fn внутри транзакции, заблокировав строку площадки (FOR UPDATE):
 * два одновременных запроса не смогут вместе превысить вместимость.
 *
 * fn возвращает либо { result }, либо fail(...). При fail транзакция откатывается.
 * Непредвиденные ошибки (например, упала БД) пробрасываются дальше в errorHandler.
 */
async function withVenueLock(venueId, fn) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const venue = await client.query(
      'SELECT "Вместимость" AS capacity FROM "Площадка" WHERE "id_Площадки" = $1 FOR UPDATE',
      [venueId]
    );
    if (!venue.rowCount) {
      await client.query('ROLLBACK');
      return fail(400, 'Площадка не найдена');
    }

    const outcome = await fn(client, venue.rows[0].capacity);
    await client.query(outcome.error ? 'ROLLBACK' : 'COMMIT');
    return outcome;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function countSeats(client, venueId) {
  const { rows } = await client.query(
    'SELECT COUNT(*)::int AS count FROM "Места" WHERE "id_Площадки" = $1',
    [venueId]
  );
  return rows[0].count;
}

export const getAll = async (req, res) => {
  const { limit, offset } = getPagination(req);
  const venueId = getOptionalId(req, 'venue_id');
  if (Number.isNaN(venueId)) {
    return res.status(400).json({ error: 'Параметр venue_id должен быть положительным целым числом' });
  }

  const { rows } = await db.query(
    `SELECT ${COLUMNS}
       FROM "Места"
      WHERE ($1::int IS NULL OR "id_Площадки" = $1)
      ORDER BY "id_Площадки", "Ряд", "Номер"
      LIMIT $2 OFFSET $3`,
    [venueId, limit, offset]
  );
  res.json(rows);
};

export const getById = async (req, res) => {
  const { rows } = await db.query(
    `SELECT ${COLUMNS} FROM "Места" WHERE "id_Места" = $1`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Место не найдено' });
  res.json(rows[0]);
};

export const create = async (req, res) => {
  const { venue_id, row_number, seat_number } = req.body;
  // Тип места связывает место с типом билета, поэтому сохраняем без лишних пробелов
  const seat_type = req.body.seat_type.trim();

  const { error, result } = await withVenueLock(venue_id, async (client, capacity) => {
    if ((await countSeats(client, venue_id)) + 1 > capacity) {
      return fail(409, `Превышена вместимость площадки (${capacity})`);
    }

    const dup = await client.query(
      'SELECT 1 FROM "Места" WHERE "id_Площадки" = $1 AND "Ряд" = $2 AND "Номер" = $3',
      [venue_id, row_number, seat_number]
    );
    if (dup.rowCount) return fail(409, 'Такое место уже есть на этой площадке');

    const { rows } = await client.query(
      `INSERT INTO "Места" ("id_Площадки", "Ряд", "Номер", "Тип_Места")
       VALUES ($1, $2, $3, $4)
       RETURNING ${COLUMNS}`,
      [venue_id, row_number, seat_number, seat_type]
    );
    return { result: rows[0] };
  });

  if (error) return res.status(error.status).json({ error: error.message });
  res.status(201).json(result);
};

// Массовое создание: rows_count рядов по seats_per_row мест, начиная с start_row
export const createBulk = async (req, res) => {
  const { venue_id, rows_count, seats_per_row, start_row = 1 } = req.body;
  const seat_type = req.body.seat_type.trim();
  const lastRow = start_row + rows_count - 1;
  const total = rows_count * seats_per_row;

  const { error } = await withVenueLock(venue_id, async (client, capacity) => {
    if ((await countSeats(client, venue_id)) + total > capacity) {
      return fail(409, `Превышена вместимость площадки (${capacity})`);
    }

    const clash = await client.query(
      `SELECT COUNT(*)::int AS count
         FROM "Места"
        WHERE "id_Площадки" = $1 AND "Ряд" BETWEEN $2 AND $3 AND "Номер" BETWEEN 1 AND $4`,
      [venue_id, start_row, lastRow, seats_per_row]
    );
    if (clash.rows[0].count > 0) {
      return fail(409, 'В указанном диапазоне рядов и мест уже есть созданные места');
    }

    await client.query(
      `INSERT INTO "Места" ("id_Площадки", "Ряд", "Номер", "Тип_Места")
       SELECT $1::int, r, n, $5::varchar
         FROM generate_series($2::int, $3::int) AS r
        CROSS JOIN generate_series(1, $4::int) AS n
        ORDER BY r, n`,
      [venue_id, start_row, lastRow, seats_per_row, seat_type]
    );
    return { result: true };
  });

  if (error) return res.status(error.status).json({ error: error.message });
  res.status(201).json({
    created: total,
    venue_id,
    first_row: start_row,
    last_row: lastRow,
    seats_per_row,
    seat_type,
  });
};

export const update = async (req, res) => {
  const { row_number, seat_number } = req.body;
  const seat_type = req.body.seat_type.trim();

  const current = await db.query(
    'SELECT "id_Площадки" AS venue_id FROM "Места" WHERE "id_Места" = $1',
    [req.params.id]
  );
  if (!current.rowCount) return res.status(404).json({ error: 'Место не найдено' });

  const dup = await db.query(
    `SELECT 1 FROM "Места"
      WHERE "id_Площадки" = $1 AND "Ряд" = $2 AND "Номер" = $3 AND "id_Места" <> $4`,
    [current.rows[0].venue_id, row_number, seat_number, req.params.id]
  );
  if (dup.rowCount) return res.status(409).json({ error: 'Такое место уже есть на этой площадке' });

  // Цена билета определяется типом места: нельзя менять его, если на место уже есть
  // неотменённые билеты другого типа места
  const conflict = await db.query(
    `SELECT 1
       FROM "Билет" b
       JOIN "Тип_Билета" t ON t."id_Типа" = b."id_Типа"
      WHERE b."id_Места" = $1 AND b."Статус" <> $2 AND t."Тип_Места" <> $3
      LIMIT 1`,
    [req.params.id, TICKET_STATUS.CANCELLED, seat_type]
  );
  if (conflict.rowCount) {
    return res.status(409).json({ error: 'Нельзя изменить тип места: на него есть неотменённые билеты другого типа' });
  }

  const { rows } = await db.query(
    `UPDATE "Места"
        SET "Ряд" = $1, "Номер" = $2, "Тип_Места" = $3
      WHERE "id_Места" = $4
      RETURNING ${COLUMNS}`,
    [row_number, seat_number, seat_type, req.params.id]
  );
  res.json(rows[0]);
};

export const remove = async (req, res) => {
  const tickets = await db.query(
    'SELECT 1 FROM "Билет" WHERE "id_Места" = $1 LIMIT 1',
    [req.params.id]
  );
  if (tickets.rowCount) {
    return res.status(409).json({ error: 'Нельзя удалить место, на которое есть билеты' });
  }

  const { rowCount } = await db.query('DELETE FROM "Места" WHERE "id_Места" = $1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'Место не найдено' });
  res.status(204).send();
};
