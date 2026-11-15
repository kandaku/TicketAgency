// Очистка базы.
//   npm run db:clear                     удаляет ТОЛЬКО тестовые данные из db:seed, ваши данные не трогает
//   npm run db:clear -- --all            удаляет ВСЕ данные из всех таблиц (с подтверждением)
//   npm run db:clear -- --all --yes      то же без вопроса
import readline from 'node:readline/promises';
import db from '../db.js';
import { VENUE_PREFIX, CUSTOMER_EMAIL_DOMAIN } from './seedConfig.js';

const args = process.argv.slice(2);
const wipeAll = args.includes('--all');
const assumeYes = args.includes('--yes');

async function confirm(question) {
  if (assumeYes) return true;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = (await rl.question(question)).trim().toLowerCase();
  rl.close();
  return ['yes', 'y', 'да', 'д'].includes(answer);
}

const client = await db.pool.connect();
let inTransaction = false;

try {
  if (wipeAll) {
    // ---------- полная очистка ----------
    const { rows } = await client.query(
      `SELECT (SELECT COUNT(*) FROM "Билет")::int       AS tickets,
              (SELECT COUNT(*) FROM "Заказ")::int       AS orders,
              (SELECT COUNT(*) FROM "Тип_Билета")::int  AS ticket_types,
              (SELECT COUNT(*) FROM "Мероприятие")::int AS events,
              (SELECT COUNT(*) FROM "Места")::int       AS seats,
              (SELECT COUNT(*) FROM "Площадка")::int    AS venues,
              (SELECT COUNT(*) FROM "Клиент")::int      AS customers`
    );
    const c = rows[0];
    console.log('ВНИМАНИЕ: будут удалены ВСЕ данные (включая ваши, не только тестовые):');
    console.log(`  билетов: ${c.tickets}, заказов: ${c.orders}, типов билетов: ${c.ticket_types}, мероприятий: ${c.events}`);
    console.log(`  мест: ${c.seats}, площадок: ${c.venues}, клиентов: ${c.customers}`);

    if (!(await confirm('Продолжить? Введите yes или да: '))) {
      console.log('Отменено, ничего не удалено.');
    } else {
      // RESTART IDENTITY: счётчики id снова начнутся с 1
      await client.query(
        `TRUNCATE "Билет", "Заказ", "Тип_Билета", "Мероприятие", "Места", "Площадка", "Клиент"
         RESTART IDENTITY CASCADE`
      );
      console.log('Все таблицы очищены, нумерация id начнётся с 1.');
    }
  } else {
    // ---------- очистка только тестовых данных ----------
    const venues = await client.query('SELECT "id_Площадки" AS id FROM "Площадка" WHERE "Название" LIKE $1', [
      `${VENUE_PREFIX}%`,
    ]);
    const customers = await client.query('SELECT "id_Клиента" AS id FROM "Клиент" WHERE "email" LIKE $1', [
      `%${CUSTOMER_EMAIL_DOMAIN}`,
    ]);
    const venueIds = venues.rows.map((r) => r.id);
    const customerIds = customers.rows.map((r) => r.id);

    if (!venueIds.length && !customerIds.length) {
      console.log('Тестовых данных в базе нет, удалять нечего.');
    } else {
      await client.query('BEGIN');
      inTransaction = true;

      const events = await client.query(
        'SELECT "id_Мероприятия" AS id FROM "Мероприятие" WHERE "id_Площадки" = ANY($1::int[])',
        [venueIds]
      );
      const eventIds = events.rows.map((r) => r.id);

      // 1. Билеты на тестовые мероприятия и билеты в заказах тестовых клиентов
      const tickets = await client.query(
        `DELETE FROM "Билет"
          WHERE "id_Мероприятия" = ANY($1::int[])
             OR "id_Заказа" IN (SELECT "id_Заказа" FROM "Заказ" WHERE "id_Клиента" = ANY($2::int[]))
          RETURNING "id_Заказа" AS order_id`,
        [eventIds, customerIds]
      );
      const touchedOrders = [...new Set(tickets.rows.map((r) => r.order_id))];

      // 2. Заказы тестовых клиентов и заказы, в которых не осталось билетов
      //    (заказ настоящего клиента на тестовое мероприятие). Заказы с другими билетами сохраняются.
      const orders = await client.query(
        `DELETE FROM "Заказ" o
          WHERE o."id_Клиента" = ANY($1::int[])
             OR (o."id_Заказа" = ANY($2::int[])
                 AND NOT EXISTS (SELECT 1 FROM "Билет" b WHERE b."id_Заказа" = o."id_Заказа"))
          RETURNING 1`,
        [customerIds, touchedOrders]
      );

      // 3. Остальное: типы билетов, мероприятия, места, площадки, клиенты
      const types = await client.query(
        'DELETE FROM "Тип_Билета" WHERE "id_Мероприятия" = ANY($1::int[]) RETURNING 1',
        [eventIds]
      );
      const eventsDeleted = await client.query(
        'DELETE FROM "Мероприятие" WHERE "id_Мероприятия" = ANY($1::int[]) RETURNING 1',
        [eventIds]
      );
      const seats = await client.query(
        'DELETE FROM "Места" WHERE "id_Площадки" = ANY($1::int[]) RETURNING 1',
        [venueIds]
      );
      const venuesDeleted = await client.query(
        'DELETE FROM "Площадка" WHERE "id_Площадки" = ANY($1::int[]) RETURNING 1',
        [venueIds]
      );
      const customersDeleted = await client.query(
        'DELETE FROM "Клиент" WHERE "id_Клиента" = ANY($1::int[]) RETURNING 1',
        [customerIds]
      );

      await client.query('COMMIT');
      inTransaction = false;

      console.log('Тестовые данные удалены:');
      console.log(`  билетов: ${tickets.rowCount}, заказов: ${orders.rowCount}, типов билетов: ${types.rowCount}`);
      console.log(`  мероприятий: ${eventsDeleted.rowCount}, мест: ${seats.rowCount}`);
      console.log(`  площадок: ${venuesDeleted.rowCount}, клиентов: ${customersDeleted.rowCount}`);
      console.log('Ваши данные не затронуты. Для полной очистки: npm run db:clear -- --all');
    }
  }
} catch (err) {
  if (inTransaction) await client.query('ROLLBACK');
  console.error('Ошибка при очистке:', err.message);
  process.exitCode = 1;
} finally {
  client.release();
  await db.pool.end();
}
