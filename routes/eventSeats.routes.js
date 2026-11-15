import { Router } from 'express';
import * as controller from '../controllers/eventSeats.controller.js';
import { validateId } from '../middleware/validate.js';

// Подключается по тому же префиксу /events, что и events.routes.js
const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     EventSeat:
 *       type: object
 *       properties:
 *         seat_id: { type: integer, example: 15 }
 *         row_number: { type: integer, example: 1 }
 *         seat_number: { type: integer, example: 15 }
 *         seat_type: { type: string, example: Партер }
 *         is_available: { type: boolean, example: true }
 *     EventSeats:
 *       type: object
 *       properties:
 *         event_id: { type: integer, example: 1 }
 *         event_name: { type: string, example: Концерт симфонического оркестра }
 *         venue_id: { type: integer, example: 1 }
 *         total: { type: integer, description: Всего мест на площадке, example: 200 }
 *         available: { type: integer, description: Свободных мест, example: 198 }
 *         seats:
 *           type: array
 *           items: { $ref: '#/components/schemas/EventSeat' }
 */

/**
 * @openapi
 * /events/{id}/seats:
 *   get:
 *     tags: [Мероприятия]
 *     summary: Схема мест мероприятия (свободно / занято)
 *     description: >
 *       Все места площадки мероприятия. Место занято, если на него есть неотменённый билет
 *       (reserved или sold) на это мероприятие.
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *       - in: query
 *         name: only_available
 *         description: Вернуть только свободные места
 *         schema: { type: boolean, default: false }
 *     responses:
 *       200:
 *         description: Места мероприятия
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/EventSeats' }
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id/seats', validateId(), controller.getEventSeats);

export default router;
