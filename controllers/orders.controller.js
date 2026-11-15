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
            COALESCE(SUM(b."Цена") FILTER (WHERE b."Статус" <> $3), 0)::float8   AS total
       FROM "Заказ" o
       LEFT JOIN "Билет" b ON b."id_Заказа" = o."id_Заказа"
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
 * Создание заказа: customer_id + items[{ event_id, seat_id }].
 * Тип билета и цена определяются на сервере: по типу места (seat_type) и мероприятию
 * находится тип билета, у которого совпадает мероприятие и "Тип_Места".
 * Всё выполняется в одной транзакции: либо создаётся заказ со всеми билетами
 * (статус reserved), либо ничего.
 */
export const create = async (req, res) => {
  const { customer_id, items } = req.body;

  const { error, result: orderId } = await withTransaction(async (client) => {
    const customer = await client.query('SELECT 1 FROM "Клиент" WHERE "id_Клиента" = $1', [customer_id]);
    if (!customer.rowCount) return fail(400, 'Клиент не найден');

    // 1. Мероприятия. Блокируем их (в порядке возрастания id, чтобы не было взаимных блокировок):
    //    параллельные заказы на одно мероприятие выполняются по очереди, двойная продажа исключена.
    const eventIds = [...new Set(items.map((i) => i.event_id))].sort((a, b) => a - b);
    const eventsRes = await client.query(
      `SELECT "id_Мероприятия" AS event_id,
              "id_Площадки"    AS venue_id,
              ("Дата" < NOW()) AS is_past
         FROM "Мероприятие"
        WHERE "id_Мероприятия" = ANY($1::int[])
        ORDER BY "id_Мероприятия"
          FOR UPDATE`,
      [eventIds]
    );
    const events = new Map(eventsRes.rows.map((r) => [r.event_id, r]));

    const missingEvent = eventIds.find((id) => !events.has(id));
    if (missingEvent) return fail(400, `Мероприятие ${missingEvent} не найдено`);

    const past = [...events.values()].find((e) => e.is_past);
    if (past) return fail(409, `Мероприятие ${past.event_id} уже прошло`);

    // 2. Места: существуют и относятся к площадке своего мероприятия
    const seatIds = [...new Set(items.map((i) => i.seat_id))];
    const seatsRes = await client.query(
      `SELECT "id_Места"    AS seat_id,
              "id_Площадки" AS venue_id,
              "Тип_Места"   AS seat_type
         FROM "Места" WHERE "id_Места" = ANY($1::int[])`,
      [seatIds]
    );
    const seats = new Map(seatsRes.rows.map((r) => [r.seat_id, r]));

    // 3. Типы билетов этих мероприятий: ключ "мероприятие:тип места"
    const typesRes = await client.query(
      `SELECT "id_Типа" AS ticket_type_id, "id_Мероприятия" AS event_id, "Тип_Места" AS seat_type
         FROM "Тип_Билета" WHERE "id_Мероприятия" = ANY($1::int[])`,
      [eventIds]
    );
    const types = new Map(typesRes.rows.map((r) => [`${r.event_id}:${r.seat_type}`, r.ticket_type_id]));

    // 4. Проверка каждой позиции, тип билета подбирается по месту и мероприятию
    const keys = new Set();
    const resolved = [];
    for (const item of items) {
      const seat = seats.get(item.seat_id);
      if (!seat) return fail(400, `Место ${item.seat_id} не найдено`);

      if (seat.venue_id !== events.get(item.event_id).venue_id) {
        return fail(400, `Место ${item.seat_id} не относится к площадке мероприятия ${item.event_id}`);
      }

      const key = `${item.event_id}:${item.seat_id}`;
      if (keys.has(key)) return fail(400, `Место ${item.seat_id} указано в заказе несколько раз`);
      keys.add(key);

      const ticketTypeId = types.get(`${item.event_id}:${seat.seat_type}`);
      if (!ticketTypeId) {
        return fail(
          409,
          `На место ${item.seat_id} (тип "${seat.seat_type}") билеты на мероприятие ${item.event_id} не продаются`
        );
      }
      resolved.push({ seatId: item.seat_id, eventId: item.event_id, ticketTypeId });
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

    // 7. Все билеты одним запросом; цена копируется из типа билета и дальше не меняется
    await client.query(
      `INSERT INTO "Билет" ("id_Места", "Статус", "id_Мероприятия", "id_Типа", "Цена", "id_Заказа")
       SELECT x.s, $4::varchar, x.e, x.t, t."Цена", $5::int
         FROM unnest($1::int[], $2::int[], $3::int[]) AS x(s, e, t)
         JOIN "Тип_Билета" t ON t."id_Типа" = x.t`,
      [
        resolved.map((r) => r.seatId),
        resolved.map((r) => r.eventId),
        resolved.map((r) => r.ticketTypeId),
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
