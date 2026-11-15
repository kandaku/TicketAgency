import db from '../db.js';
import { getPagination, getOptionalId } from '../utils/query.js';
import { ORDER_STATUS, TICKET_STATUS } from '../utils/statuses.js';
import { withTransaction, fail, sendError } from '../utils/transaction.js';
import { TICKET_SELECT } from '../utils/ticketSelect.js';

async function fetchTicket(id) {
  const { rows } = await db.query(`${TICKET_SELECT} WHERE b."id_Билета" = $1`, [id]);
  return rows[0];
}

// Билеты создаются только через заказы (POST /orders), отдельного POST здесь нет
export const getAll = async (req, res) => {
  const { limit, offset } = getPagination(req);

  const orderId = getOptionalId(req, 'order_id');
  if (Number.isNaN(orderId)) {
    return res.status(400).json({ error: 'Параметр order_id должен быть положительным целым числом' });
  }
  const eventId = getOptionalId(req, 'event_id');
  if (Number.isNaN(eventId)) {
    return res.status(400).json({ error: 'Параметр event_id должен быть положительным целым числом' });
  }

  const status = req.query.status || null;
  if (status !== null && !Object.values(TICKET_STATUS).includes(status)) {
    return res.status(400).json({
      error: `Параметр status должен быть одним из: ${Object.values(TICKET_STATUS).join(', ')}`,
    });
  }

  const { rows } = await db.query(
    `${TICKET_SELECT}
      WHERE ($1::int  IS NULL OR b."id_Заказа"      = $1)
        AND ($2::int  IS NULL OR b."id_Мероприятия" = $2)
        AND ($3::text IS NULL OR b."Статус"         = $3)
      ORDER BY b."id_Билета"
      LIMIT $4 OFFSET $5`,
    [orderId, eventId, status, limit, offset]
  );
  res.json(rows);
};

export const getById = async (req, res) => {
  const ticket = await fetchTicket(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Билет не найден' });
  res.json(ticket);
};

// Отмена одного билета. Если в заказе не осталось активных билетов, заказ тоже отменяется.
export const cancel = async (req, res) => {
  const { error } = await withTransaction(async (client) => {
    const found = await client.query('SELECT "id_Заказа" AS order_id FROM "Билет" WHERE "id_Билета" = $1', [
      req.params.id,
    ]);
    if (!found.rowCount) return fail(404, 'Билет не найден');
    const { order_id: orderId } = found.rows[0];

    // Сначала блокируем заказ (как в оплате и отмене заказа), затем перечитываем билет
    await client.query('SELECT 1 FROM "Заказ" WHERE "id_Заказа" = $1 FOR UPDATE', [orderId]);

    const ticket = await client.query('SELECT "Статус" AS status FROM "Билет" WHERE "id_Билета" = $1', [
      req.params.id,
    ]);
    if (ticket.rows[0].status === TICKET_STATUS.CANCELLED) return fail(409, 'Билет уже отменён');

    await client.query('UPDATE "Билет" SET "Статус" = $1 WHERE "id_Билета" = $2', [
      TICKET_STATUS.CANCELLED,
      req.params.id,
    ]);

    const active = await client.query(
      'SELECT COUNT(*)::int AS count FROM "Билет" WHERE "id_Заказа" = $1 AND "Статус" <> $2',
      [orderId, TICKET_STATUS.CANCELLED]
    );
    if (active.rows[0].count === 0) {
      await client.query('UPDATE "Заказ" SET "Статус" = $1 WHERE "id_Заказа" = $2', [
        ORDER_STATUS.CANCELLED,
        orderId,
      ]);
    }
    return { result: true };
  });

  if (error) return sendError(res, error);
  res.json(await fetchTicket(req.params.id));
};
