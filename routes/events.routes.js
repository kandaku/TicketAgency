import { Router } from 'express';
import * as controller from '../controllers/events.controller.js';
import { validateBody, validateId } from '../middleware/validate.js';

const router = Router();

const eventRules = {
  name: { type: 'string', required: true, max: 200 },
  event_date: { type: 'datetime', required: true },
  venue_id: { type: 'integer', required: true, min: 1 },
};

/**
 * @openapi
 * components:
 *   schemas:
 *     EventInput:
 *       type: object
 *       required: [name, event_date, venue_id]
 *       properties:
 *         name: { type: string, maxLength: 200, example: Концерт симфонического оркестра }
 *         event_date:
 *           type: string
 *           description: Местное время площадки без часового пояса, формат YYYY-MM-DDTHH:mm:ss
 *           example: "2026-12-20T19:00:00"
 *         venue_id: { type: integer, minimum: 1, example: 1 }
 *     Event:
 *       allOf:
 *         - type: object
 *           properties:
 *             event_id: { type: integer, example: 1 }
 *             venue_name: { type: string, example: Крокус Сити Холл }
 *         - $ref: '#/components/schemas/EventInput'
 */

/**
 * @openapi
 * /events:
 *   get:
 *     tags: [Мероприятия]
 *     summary: Список мероприятий
 *     description: Отсортирован по дате. В каждом мероприятии есть название площадки.
 *     parameters:
 *       - in: query
 *         name: venue_id
 *         description: Только мероприятия этой площадки
 *         schema: { type: integer }
 *       - in: query
 *         name: upcoming
 *         description: Только будущие мероприятия
 *         schema: { type: boolean, default: false }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50, maximum: 200 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *     responses:
 *       200:
 *         description: Массив мероприятий
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Event' }
 *   post:
 *     tags: [Мероприятия]
 *     summary: Создать мероприятие
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/EventInput' }
 *     responses:
 *       201:
 *         description: Мероприятие создано
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Event' }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.get('/', controller.getAll);
router.post('/', validateBody(eventRules), controller.create);

/**
 * @openapi
 * /events/{id}:
 *   get:
 *     tags: [Мероприятия]
 *     summary: Получить мероприятие по ID
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Мероприятие
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Event' }
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Мероприятия]
 *     summary: Обновить мероприятие
 *     description: Сменить площадку нельзя, если на мероприятие уже есть билеты.
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/EventInput' }
 *     responses:
 *       200:
 *         description: Мероприятие обновлено
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Event' }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: На мероприятие есть билеты
 *   delete:
 *     tags: [Мероприятия]
 *     summary: Удалить мероприятие
 *     description: Вернёт 409, если у мероприятия есть билеты или типы билетов.
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       204:
 *         description: Удалено
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: Есть связанные билеты или типы билетов
 */
router.get('/:id', validateId(), controller.getById);
router.put('/:id', validateId(), validateBody(eventRules), controller.update);
router.delete('/:id', validateId(), controller.remove);

export default router;
