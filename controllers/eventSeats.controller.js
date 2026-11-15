import db from '../db.js';
import { TICKET_STATUS } from '../utils/statuses.js';

// GET /events/:id/seats: все места площадки мероприятия с типом билета, ценой и отметкой «свободно / занято».
// Тип билета определяется по паре (мероприятие, тип места). Если для типа места у мероприятия
// тип билета не заведён, место не продаётся: price = null, is_available = false.
export const getEventSeats = async (req, res) => {
  const onlyAvailable = req.query.only_available === 'true';

  const eventRes = await db.query(
    `SELECT "id_Мероприятия" AS event_id, "Название" AS event_name, "id_Площадки" AS venue_id
       FROM "Мероприятие" WHERE "id_Мероприятия" = $1`,
    [req.params.id]
  );
  if (!eventRes.rowCount) return res.status(404).json({ error: 'Мероприятие не найдено' });
  const event = eventRes.rows[0];

  const { rows } = await db.query(
    `SELECT s."id_Места"  AS seat_id,
            s."Ряд"       AS row_number,
            s."Номер"     AS seat_number,
            s."Тип_Места" AS seat_type,
            t."id_Типа"      AS ticket_type_id,
            t."Название"     AS ticket_type_name,
            t."Цена"::float8 AS price,
            (t."id_Типа" IS NOT NULL
             AND NOT EXISTS (
               SELECT 1 FROM "Билет" b
                WHERE b."id_Места" = s."id_Места"
                  AND b."id_Мероприятия" = $1
                  AND b."Статус" <> $3
             )) AS is_available
       FROM "Места" s
       LEFT JOIN "Тип_Билета" t
              ON t."id_Мероприятия" = $1
             AND t."Тип_Места"      = s."Тип_Места"
      WHERE s."id_Площадки" = $2
      ORDER BY s."Ряд", s."Номер"`,
    [event.event_id, event.venue_id, TICKET_STATUS.CANCELLED]
  );

  const available = rows.filter((seat) => seat.is_available).length;
  res.json({
    event_id: event.event_id,
    event_name: event.event_name,
    venue_id: event.venue_id,
    total: rows.length,
    available,
    seats: onlyAvailable ? rows.filter((seat) => seat.is_available) : rows,
  });
};
