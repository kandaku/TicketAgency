import db from '../db.js';
import { getPagination, getOptionalId } from '../utils/query.js';
import { ORDER_STATUS, TICKET_STATUS } from '../utils/statuses.js';
import { withTransaction, fail, sendError } from '../utils/transaction.js';
import { TICKET_SELECT } from '../utils/ticketSelect.js';

const round2 = (n) => Math.round(n * 100) / 100;

// Заказ целиком: данные заказа, билеты и итоговая сумма (без отменённых билетов)
async function fetchOrder(id) {
  const orderRes = await db.query(
    `SELECT o."id_Заказа"   AS order_id,
            o."Дата_Заказа" AS order_date,
            o."Статус"      AS status,
            o."id_Клиента"  AS customer_id,
            c."ФИО"         AS customer_name
       FROM "Заказ" o
       JOIN "Клиент" c ON c."id_Клиента" = o."id_Клиента"
      WHERE o."id_Заказа" = $1`,
    [id]
  );
  if (!orderRes.rowCount) return null;

  const ticketsRes = await db.query(
    `${TICKET_SELECT} WHERE b."id_Заказа" = $1 ORDER BY b."id_Билета"`,
    [id]
  );
  const tickets = ticketsRes.rows;
  const total = round2(
    tickets.filter((t) => t.status !== TICKET_STATUS.CANCELLED).reduce((sum, t) => sum + t.price, 0)
  );

  return { ...orderRes.rows[0], total, tickets };
}

export const getAll = async (req, res) => {
  const { limit, offset } = getPagination(req);

  const customerId = getOptionalId(req, 'customer_id');
  if (Number.isNaN(customerId)) {
    return res.status(400).json({ error: 'Параметр customer_id должен быть положительным целым числом' });
  }

  const status = req.query.status || null;
  if (status !== null && !Object.values(ORDER_STATUS).includes(status)) {
    return res.status(400).json({
      error: `Параметр status должен быть одним из: ${Object.values(ORDER_STATUS).join(', ')}`,
    });
  }

  const { rows } = await db.query(
    `SELECT o."id_Заказа"   AS order_id,
            o."Дата_Заказа" AS order_date,
            o."Статус"      AS status,
            o."id_Клиента"  AS customer_id,
            COUNT(b."id_Билета") FILTER (WHERE b."Статус" <> $3)::int            AS tickets_count,
            COALESCE(SUM(t."Цена") FILTER (WHERE b."Статус" <> $3), 0)::float8   AS total
       FROM "Заказ" o
       LEFT JOIN "Билет"      b ON b."id_Заказа" = o."id_Заказа"
       LEFT JOIN "Тип_Билета" t ON t."id_Типа"   = b."id_Типа"
      WHERE ($1::int  IS NULL OR o."id_Клиента" = $1)
        AND ($2::text IS NULL OR o."Статус"     = $2)
      GROUP BY o."id_Заказа", o."Дата_Заказа", o."Статус", o."id_Клиента"
      ORDER BY o."id_Заказа" DESC
      LIMIT $4 OFFSET $5`,
    [customerId, status, TICKET_STATUS.CANCELLED, limit, offset]
  );
  res.json(rows);
};

export const getById = async (req, res) => {
  const order = await fetchOrder(req.params.id);
  if (!order) return res.status(404).json({ error: 'Заказ не найден' });
  res.json(order);
};

/**
 * Создание заказа: customer_id + items[{ ticket_type_id, seat_id }].
 * Мероприятие определяется по типу билета. Всё выполняется в одной транзакции:
 * либо создаётся заказ со всеми билетами (статус reserved), либо ничего.
 */
export const create = async (req, res) => {
  const { customer_id, items } = req.body;

  const { error, result: orderId } = await withTransaction(async (client) => {
    const customer = await client.query('SELECT 1 FROM "Клиент" WHERE "id_Клиента" = $1', [customer_id]);
    if (!customer.rowCount) return fail(400, 'Клиент не найден');

    // 1. Типы билетов -> мероприятие и площадка
    const typeIds = [...new Set(items.map((i) => i.ticket_type_id))];
    const typesRes = await client.query(
      `SELECT t."id_Типа"        AS ticket_type_id,
              t."id_Мероприятия" AS event_id,
              e."id_Площадки"    AS venue_id,
              (e."Дата" < NOW()) AS is_past
         FROM "Тип_Билета" t
         JOIN "Мероприятие" e ON e."id_Мероприятия" = t."id_Мероприятия"
        WHERE t."id_Типа" = ANY($1::int[])`,
      [typeIds]
    );
    const types = new Map(typesRes.rows.map((r) => [r.ticket_type_id, r]));

    const missingType = typeIds.find((id) => !types.has(id));
    if (missingType) return fail(400, `Тип билета ${missingType} не найден`);

    const past = [...types.values()].find((t) => t.is_past);
    if (past) return fail(409, `Мероприятие ${past.event_id} уже прошло`);

    // 2. Блокируем мероприятия (в порядке возрастания id, чтобы не было взаимных блокировок):
    //    параллельные заказы на одно мероприятие выполняются по очереди, двойная продажа исключена.
    const eventIds = [...new Set([...types.values()].map((t) => t.event_id))].sort((a, b) => a - b);
    await client.query(
      `SELECT "id_Мероприятия" FROM "Мероприятие"
        WHERE "id_Мероприятия" = ANY($1::int[])
        ORDER BY "id_Мероприятия" FOR UPDATE`,
      [eventIds]
    );

    // 3. Места: существуют и относятся к площадке мероприятия
    const seatIds = [...new Set(items.map((i) => i.seat_id))];
    const seatsRes = await client.query(
      'SELECT "id_Места" AS seat_id, "id_Площадки" AS venue_id FROM "Места" WHERE "id_Места" = ANY($1::int[])',
      [seatIds]
    );
    const seats = new Map(seatsRes.rows.map((r) => [r.seat_id, r]));

    for (const item of items) {
      const seat = seats.get(item.seat_id);
      if (!seat) return fail(400, `Место ${item.seat_id} не найдено`);
      const type = types.get(item.ticket_type_id);
      if (seat.venue_id !== type.venue_id) {
        return fail(400, `Место ${item.seat_id} не относится к площадке мероприятия ${type.event_id}`);
      }
    }

    // 4. Одно и то же место не может повторяться в заказе
    const keys = new Set();
    for (const item of items) {
      const key = `${types.get(item.ticket_type_id).event_id}:${item.seat_id}`;
      if (keys.has(key)) return fail(400, `Место ${item.seat_id} указано в заказе несколько раз`);
      keys.add(key);
    }

    // 5. Места не заняты другими (неотменёнными) билетами на это же мероприятие
    const takenRes = await client.query(
      `SELECT "id_Места" AS seat_id, "id_Мероприятия" AS event_id
         FROM "Билет"
        WHERE "Статус" <> $3
          AND "id_Мероприятия" = ANY($1::int[])
          AND "id_Места"       = ANY($2::int[])`,
      [eventIds, seatIds, TICKET_STATUS.CANCELLED]
    );
    const taken = takenRes.rows.filter((r) => keys.has(`${r.event_id}:${r.seat_id}`));
    if (taken.length) return fail(409, 'Некоторые места уже заняты', taken);

    // 6. Заказ
    const orderRes = await client.query(
      `INSERT INTO "Заказ" ("Дата_Заказа", "Статус", "id_Клиента")
       VALUES (NOW(), $1, $2)
       RETURNING "id_Заказа" AS order_id`,
      [ORDER_STATUS.NEW, customer_id]
    );
    const newOrderId = orderRes.rows[0].order_id;

    // 7. Все билеты одним запросом
    await client.query(
      `INSERT INTO "Билет" ("id_Места", "Статус", "id_Мероприятия", "id_Типа", "id_Заказа")
       SELECT s, $4::varchar, e, t, $5::int
         FROM unnest($1::int[], $2::int[], $3::int[]) AS x(s, e, t)`,
      [
        items.map((i) => i.seat_id),
        items.map((i) => types.get(i.ticket_type_id).event_id),
        items.map((i) => i.ticket_type_id),
        TICKET_STATUS.RESERVED,
        newOrderId,
      ]
    );

    return { result: newOrderId };
  });

  if (error) return sendError(res, error);
  res.status(201).json(await fetchOrder(orderId));
};

// Оплата: заказ new -> paid, билеты reserved -> sold
export const pay = async (req, res) => {
  const { error } = await withTransaction(async (client) => {
    const order = await client.query(
      'SELECT "Статус" AS status FROM "Заказ" WHERE "id_Заказа" = $1 FOR UPDATE',
      [req.params.id]
    );
    if (!order.rowCount) return fail(404, 'Заказ не найден');

    const { status } = order.rows[0];
    if (status !== ORDER_STATUS.NEW) {
      return fail(409, `Нельзя оплатить заказ в статусе "${status}"`);
    }

    await client.query('UPDATE "Заказ" SET "Статус" = $1 WHERE "id_Заказа" = $2', [
      ORDER_STATUS.PAID,
      req.params.id,
    ]);
    await client.query(
      'UPDATE "Билет" SET "Статус" = $1 WHERE "id_Заказа" = $2 AND "Статус" = $3',
      [TICKET_STATUS.SOLD, req.params.id, TICKET_STATUS.RESERVED]
    );
    return { result: true };
  });

  if (error) return sendError(res, error);
  res.json(await fetchOrder(req.params.id));
};

// Отмена: заказ new/paid -> cancelled, все его билеты -> cancelled (места освобождаются)
export const cancel = async (req, res) => {
  const { error } = await withTransaction(async (client) => {
    const order = await client.query(
      'SELECT "Статус" AS status FROM "Заказ" WHERE "id_Заказа" = $1 FOR UPDATE',
      [req.params.id]
    );
    if (!order.rowCount) return fail(404, 'Заказ не найден');

    if (order.rows[0].status === ORDER_STATUS.CANCELLED) {
      return fail(409, 'Заказ уже отменён');
    }

    await client.query('UPDATE "Заказ" SET "Статус" = $1 WHERE "id_Заказа" = $2', [
      ORDER_STATUS.CANCELLED,
      req.params.id,
    ]);
    await client.query(
      'UPDATE "Билет" SET "Статус" = $1 WHERE "id_Заказа" = $2 AND "Статус" <> $1',
      [TICKET_STATUS.CANCELLED, req.params.id]
    );
    return { result: true };
  });

  if (error) return sendError(res, error);
  res.json(await fetchOrder(req.params.id));
};
