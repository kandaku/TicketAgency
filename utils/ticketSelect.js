// Билет вместе с данными о мероприятии, месте и типе билета.
// Используется в заказах и в списке билетов.
export const TICKET_SELECT = `
  SELECT b."id_Билета"     AS ticket_id,
         b."Статус"        AS status,
         b."id_Заказа"     AS order_id,
         b."id_Мероприятия" AS event_id,
         e."Название"      AS event_name,
         e."Дата"          AS event_date,
         b."id_Места"      AS seat_id,
         s."Ряд"           AS row_number,
         s."Номер"         AS seat_number,
         s."Тип_Места"     AS seat_type,
         b."id_Типа"       AS ticket_type_id,
         t."Название"      AS ticket_type_name,
         b."Цена"::float8  AS price
    FROM "Билет" b
    JOIN "Мероприятие" e ON e."id_Мероприятия" = b."id_Мероприятия"
    JOIN "Места"       s ON s."id_Места"       = b."id_Места"
    JOIN "Тип_Билета"  t ON t."id_Типа"        = b."id_Типа"`;
