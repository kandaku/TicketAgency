// Наполнение базы тестовыми данными: npm run db:seed
// Удалить эти данные (и только их): npm run db:clear
import db from "../db.js";
import { ORDER_STATUS, TICKET_STATUS } from "../utils/statuses.js";
import { VENUE_PREFIX, CUSTOMER_EMAIL_DOMAIN } from "./seedConfig.js";

// ---------- описание тестовых данных ----------

const venueDefs = [
  {
    name: `${VENUE_PREFIX}Большой зал`,
    address: "Москва, ул. Тверская, 1",
    capacity: 300,
    seatMap: "maps/big-hall.svg",
  },
  {
    name: `${VENUE_PREFIX}Камерная сцена`,
    address: "Санкт-Петербург, Невский пр., 10",
    capacity: 100,
    seatMap: null,
  },
];

// Места: venue — индекс площадки; ряды 1..rows по seatsPerRow мест
const seatLayouts = [
  { venue: 0, rows: 10, seatsPerRow: 20 }, // 200 мест: ряды 1-3 VIP, остальные Партер
  { venue: 1, rows: 5, seatsPerRow: 10 }, // 50 мест: Стандарт
];

const customerDefs = [
  {
    name: "Иванов Иван Иванович",
    email: "ivan.ivanov",
    phone: "+7 900 111-11-11",
  },
  {
    name: "Петрова Мария Сергеевна",
    email: "maria.petrova",
    phone: "+7 900 222-22-22",
  },
  { name: "Сидоров Пётр Алексеевич", email: "petr.sidorov", phone: null },
  {
    name: "Кузнецова Анна Дмитриевна",
    email: "anna.kuznetsova",
    phone: "+7 900 444-44-44",
  },
  {
    name: "Смирнов Алексей Олегович",
    email: "alexey.smirnov",
    phone: "+7 900 555-55-55",
  },
];

// daysFromToday: смещение даты от сегодняшнего дня (19:00 местного времени)
const eventDefs = [
  {
    name: "Концерт симфонического оркестра",
    venue: 0,
    daysFromToday: 30,
    hour: 19,
  },
  { name: "Рок-фестиваль", venue: 0, daysFromToday: 45, hour: 18 },
  { name: "Камерный вечер", venue: 1, daysFromToday: 14, hour: 19 },
  { name: "Стендап-шоу", venue: 1, daysFromToday: 21, hour: 20 },
  {
    name: "Новогодний концерт (прошедший)",
    venue: 0,
    daysFromToday: -30,
    hour: 19,
  },
];

// seatType — для каких мест действует тип билета (совпадает с "Тип_Места" у мест площадки).
// У мероприятия не может быть двух типов билета на один тип места.
// Площадка 0: ряды 1-3 VIP, остальные Партер; площадка 1: все места Стандарт.
const ticketTypeDefs = [
  { name: "VIP", seatType: "VIP", price: 5000, event: 0 }, // 0
  { name: "Партер", seatType: "Партер", price: 2000, event: 0 }, // 1
  { name: "VIP", seatType: "VIP", price: 6500, event: 1 }, // 2
  { name: "Партер", seatType: "Партер", price: 3000, event: 1 }, // 3
  { name: "Стандарт", seatType: "Стандарт", price: 1200, event: 2 }, // 4
  { name: "Стандарт", seatType: "Стандарт", price: 1500, event: 3 }, // 5
  { name: "Партер", seatType: "Партер", price: 1000, event: 4 }, // 6
];

// Заказы в разных статусах. type — индекс из ticketTypeDefs, venue/row/seat — место.
const orderDefs = [
  {
    customer: 0,
    daysAgo: 12,
    status: ORDER_STATUS.PAID,
    ticketStatus: TICKET_STATUS.SOLD,
    items: [
      { type: 0, venue: 0, row: 1, seat: 1 },
      { type: 0, venue: 0, row: 1, seat: 2 },
    ],
  },
  {
    customer: 1,
    daysAgo: 1,
    status: ORDER_STATUS.NEW,
    ticketStatus: TICKET_STATUS.RESERVED,
    items: [{ type: 1, venue: 0, row: 5, seat: 10 }],
  },
  {
    customer: 2,
    daysAgo: 5,
    status: ORDER_STATUS.CANCELLED,
    ticketStatus: TICKET_STATUS.CANCELLED,
    items: [
      { type: 3, venue: 0, row: 6, seat: 1 },
      { type: 3, venue: 0, row: 6, seat: 2 },
    ],
  },
  {
    customer: 3,
    daysAgo: 3,
    status: ORDER_STATUS.PAID,
    ticketStatus: TICKET_STATUS.SOLD,
    items: [
      { type: 4, venue: 1, row: 1, seat: 1 },
      { type: 4, venue: 1, row: 1, seat: 2 },
      { type: 4, venue: 1, row: 1, seat: 3 },
    ],
  },
  {
    customer: 0,
    daysAgo: 40,
    status: ORDER_STATUS.PAID,
    ticketStatus: TICKET_STATUS.SOLD,
    items: [{ type: 6, venue: 0, row: 8, seat: 5 }],
  },
];

// ---------- выполнение ----------

const client = await db.pool.connect();
let inTransaction = false;

try {
  const existing = await client.query(
    `SELECT (SELECT COUNT(*) FROM "Площадка" WHERE "Название" LIKE $1)::int AS venues,
            (SELECT COUNT(*) FROM "Клиент"   WHERE "email"    LIKE $2)::int AS customers`,
    [`${VENUE_PREFIX}%`, `%${CUSTOMER_EMAIL_DOMAIN}`],
  );

  if (existing.rows[0].venues > 0 || existing.rows[0].customers > 0) {
    console.log("Тестовые данные уже есть в базе, ничего не добавлено.");
    console.log(
      "Чтобы пересоздать их: npm run db:clear, затем npm run db:seed",
    );
  } else {
    await client.query("BEGIN");
    inTransaction = true;

    // Площадки
    const venueIds = [];
    for (const v of venueDefs) {
      const { rows } = await client.query(
        `INSERT INTO "Площадка" ("Название", "Адрес", "Вместимость", "Схема_Мест")
         VALUES ($1, $2, $3, $4) RETURNING "id_Площадки" AS id`,
        [v.name, v.address, v.capacity, v.seatMap],
      );
      venueIds.push(rows[0].id);
    }

    // Места (одним запросом на площадку)
    let seatsTotal = 0;
    for (const layout of seatLayouts) {
      const { rowCount } = await client.query(
        `INSERT INTO "Места" ("id_Площадки", "Ряд", "Номер", "Тип_Места")
         SELECT $1::int, r, n,
                CASE WHEN $4::int = 0 AND r <= 3 THEN 'VIP'
                     WHEN $4::int = 0 THEN 'Партер'
                     ELSE 'Стандарт' END
           FROM generate_series(1, $2::int) AS r
          CROSS JOIN generate_series(1, $3::int) AS n`,
        [venueIds[layout.venue], layout.rows, layout.seatsPerRow, layout.venue],
      );
      seatsTotal += rowCount;
    }

    // Клиенты
    const customerIds = [];
    for (const c of customerDefs) {
      const { rows } = await client.query(
        `INSERT INTO "Клиент" ("ФИО", "email", "Телефон", "Дата_Регистрации")
         VALUES ($1, $2, $3, NOW() - interval '60 days') RETURNING "id_Клиента" AS id`,
        [c.name, `${c.email}${CUSTOMER_EMAIL_DOMAIN}`, c.phone],
      );
      customerIds.push(rows[0].id);
    }

    // Мероприятия
    const eventIds = [];
    for (const e of eventDefs) {
      const { rows } = await client.query(
        `INSERT INTO "Мероприятие" ("Название", "Дата", "id_Площадки")
         VALUES ($1,
                 date_trunc('day', LOCALTIMESTAMP) + make_interval(days => $2::int, hours => $3::int),
                 $4)
         RETURNING "id_Мероприятия" AS id`,
        [e.name, e.daysFromToday, e.hour, venueIds[e.venue]],
      );
      eventIds.push(rows[0].id);
    }

    // Типы билетов
    const typeIds = [];
    for (const t of ticketTypeDefs) {
      const { rows } = await client.query(
        `INSERT INTO "Тип_Билета" ("Название", "Цена", "id_Мероприятия", "Тип_Места")
         VALUES ($1, $2, $3, $4) RETURNING "id_Типа" AS id`,
        [t.name, t.price, eventIds[t.event], t.seatType],
      );
      typeIds.push(rows[0].id);
    }

    // Справочник мест для заказов: "индекс площадки:ряд:номер" -> id места
    const seatRows = await client.query(
      `SELECT "id_Места" AS id, "id_Площадки" AS venue_id, "Ряд" AS r, "Номер" AS n
         FROM "Места" WHERE "id_Площадки" = ANY($1::int[])`,
      [venueIds],
    );
    const seatId = new Map(
      seatRows.rows.map((s) => [
        `${venueIds.indexOf(s.venue_id)}:${s.r}:${s.n}`,
        s.id,
      ]),
    );

    // Заказы и билеты
    let ticketsTotal = 0;
    for (const o of orderDefs) {
      const { rows } = await client.query(
        `INSERT INTO "Заказ" ("Дата_Заказа", "Статус", "id_Клиента")
         VALUES (NOW() - make_interval(days => $1::int), $2, $3)
         RETURNING "id_Заказа" AS id`,
        [o.daysAgo, o.status, customerIds[o.customer]],
      );
      const orderId = rows[0].id;

      for (const item of o.items) {
        const seat = seatId.get(`${item.venue}:${item.row}:${item.seat}`);
        const eventIdx = ticketTypeDefs[item.type].event;
        await client.query(
          `INSERT INTO "Билет" ("id_Места", "Статус", "id_Мероприятия", "id_Типа", "Цена", "id_Заказа")
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            seat,
            o.ticketStatus,
            eventIds[eventIdx],
            typeIds[item.type],
            ticketTypeDefs[item.type].price,
            orderId,
          ],
        );
        ticketsTotal += 1;
      }
    }

    await client.query("COMMIT");
    inTransaction = false;

    console.log("Тестовые данные добавлены:");
    console.log(`  площадок: ${venueIds.length}, мест: ${seatsTotal}`);
    console.log(
      `  клиентов: ${customerIds.length}, мероприятий: ${eventIds.length}, типов билетов: ${typeIds.length}`,
    );
    console.log(`  заказов: ${orderDefs.length}, билетов: ${ticketsTotal}`);
    console.log(
      `Тестовые клиенты: *${CUSTOMER_EMAIL_DOMAIN}, площадки: "${VENUE_PREFIX.trim()} ..."`,
    );
    console.log("Удалить их: npm run db:clear");
  }
} catch (err) {
  if (inTransaction) await client.query("ROLLBACK");
  console.error("Ошибка при добавлении тестовых данных:", err.message);
  process.exitCode = 1;
} finally {
  client.release();
  await db.pool.end();
}
