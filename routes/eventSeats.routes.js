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
 *         ticket_type_id: { type: integer, nullable: true, description: Тип билета для этого места на это мероприятие. null, если тип не заведён, example: 3 }
 *         ticket_type_name: { type: string, nullable: true, example: Партер }
 *         price: { type: number, nullable: true, description: Цена билета на это место. null, если место не продаётся, example: 3000 }
 *         is_available: { type: boolean, description: Место свободно и на него есть тип билета, example: true }
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
 *       Все места площадки мероприятия с типом билета и ценой. Тип билета определяется по паре
 *       (мероприятие, тип места). Место недоступно (is_available = false), если на него есть
 *       неотменённый билет (reserved или sold) на это мероприятие или если для типа места
 *       у мероприятия не заведён тип билета (тогда ticket_type_id и price равны null).
 *       Для заказа достаточно передать event_id и seat_id.
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
