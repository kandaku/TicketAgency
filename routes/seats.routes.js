import { Router } from 'express';
import * as controller from '../controllers/seats.controller.js';
import { validateBody, validateId } from '../middleware/validate.js';

const router = Router();

const seatCreateRules = {
  venue_id: { type: 'integer', required: true, min: 1 },
  row_number: { type: 'integer', required: true, min: 1 },
  seat_number: { type: 'integer', required: true, min: 1 },
  seat_type: { type: 'string', required: true, max: 50 },
};

const seatUpdateRules = {
  row_number: { type: 'integer', required: true, min: 1 },
  seat_number: { type: 'integer', required: true, min: 1 },
  seat_type: { type: 'string', required: true, max: 50 },
};

const seatBulkRules = {
  venue_id: { type: 'integer', required: true, min: 1 },
  rows_count: { type: 'integer', required: true, min: 1, max: 500 },
  seats_per_row: { type: 'integer', required: true, min: 1, max: 500 },
  start_row: { type: 'integer', min: 1 },
  seat_type: { type: 'string', required: true, max: 50 },
};

/**
 * @openapi
 * components:
 *   schemas:
 *     SeatInput:
 *       type: object
 *       required: [venue_id, row_number, seat_number, seat_type]
 *       properties:
 *         venue_id: { type: integer, minimum: 1, example: 1 }
 *         row_number: { type: integer, minimum: 1, example: 5 }
 *         seat_number: { type: integer, minimum: 1, example: 12 }
 *         seat_type: { type: string, maxLength: 50, example: Партер }
 *     SeatUpdate:
 *       type: object
 *       required: [row_number, seat_number, seat_type]
 *       properties:
 *         row_number: { type: integer, minimum: 1, example: 5 }
 *         seat_number: { type: integer, minimum: 1, example: 12 }
 *         seat_type: { type: string, maxLength: 50, example: Партер }
 *     Seat:
 *       allOf:
 *         - type: object
 *           properties:
 *             seat_id: { type: integer, example: 1 }
 *         - $ref: '#/components/schemas/SeatInput'
 *     SeatBulkInput:
 *       type: object
 *       required: [venue_id, rows_count, seats_per_row, seat_type]
 *       properties:
 *         venue_id: { type: integer, minimum: 1, example: 1 }
 *         rows_count: { type: integer, minimum: 1, maximum: 500, example: 10 }
 *         seats_per_row: { type: integer, minimum: 1, maximum: 500, example: 20 }
 *         start_row: { type: integer, minimum: 1, default: 1, example: 1 }
 *         seat_type: { type: string, maxLength: 50, example: Партер }
 */

/**
 * @openapi
 * /seats:
 *   get:
 *     tags: [Места]
 *     summary: Список мест
 *     parameters:
 *       - in: query
 *         name: venue_id
 *         description: Только места этой площадки
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50, maximum: 200 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *     responses:
 *       200:
 *         description: Массив мест
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Seat' }
 *   post:
 *     tags: [Места]
 *     summary: Создать одно место
 *     description: Проверяет, что площадка существует, место уникально и вместимость не превышена.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/SeatInput' }
 *     responses:
 *       201:
 *         description: Место создано
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Seat' }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: Место уже существует или превышена вместимость
 */
router.get('/', controller.getAll);
router.post('/', validateBody(seatCreateRules), controller.create);

/**
 * @openapi
 * /seats/bulk:
 *   post:
 *     tags: [Места]
 *     summary: Массовое создание мест
 *     description: >
 *       Создаёт rows_count рядов по seats_per_row мест, начиная с ряда start_row.
 *       Всё выполняется в одной транзакции: либо создаются все места, либо ни одного.
 *       Пример: 10 рядов по 20 мест = 200 мест.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/SeatBulkInput' }
 *     responses:
 *       201:
 *         description: Места созданы
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 created: { type: integer, example: 200 }
 *                 venue_id: { type: integer, example: 1 }
 *                 first_row: { type: integer, example: 1 }
 *                 last_row: { type: integer, example: 10 }
 *                 seats_per_row: { type: integer, example: 20 }
 *                 seat_type: { type: string, example: Партер }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: В диапазоне уже есть места или превышена вместимость
 */
router.post('/bulk', validateBody(seatBulkRules), controller.createBulk);

/**
 * @openapi
 * /seats/{id}:
 *   get:
 *     tags: [Места]
 *     summary: Получить место по ID
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Место
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Seat' }
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Места]
 *     summary: Изменить ряд, номер или тип места
 *     description: Площадку у места менять нельзя.
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/SeatUpdate' }
 *     responses:
 *       200:
 *         description: Место обновлено
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Seat' }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: Такое место уже есть на площадке
 *   delete:
 *     tags: [Места]
 *     summary: Удалить место
 *     description: Вернёт 409, если на это место есть билеты.
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       204:
 *         description: Удалено
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: На место есть билеты
 */
router.get('/:id', validateId(), controller.getById);
router.put('/:id', validateId(), validateBody(seatUpdateRules), controller.update);
router.delete('/:id', validateId(), controller.remove);

export default router;
