import { Router } from 'express';
import * as controller from '../controllers/tickets.controller.js';
import { validateId } from '../middleware/validate.js';

const router = Router();

/**
 * @openapi
 * /tickets:
 *   get:
 *     tags: [Билеты]
 *     summary: Список билетов
 *     description: Билеты создаются только через заказы (POST /orders).
 *     parameters:
 *       - in: query
 *         name: order_id
 *         schema: { type: integer }
 *       - in: query
 *         name: event_id
 *         schema: { type: integer }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [reserved, sold, cancelled] }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50, maximum: 200 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *     responses:
 *       200:
 *         description: Массив билетов
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Ticket' }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.get('/', controller.getAll);

/**
 * @openapi
 * /tickets/{id}:
 *   get:
 *     tags: [Билеты]
 *     summary: Получить билет по ID
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Билет
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Ticket' }
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', validateId(), controller.getById);

/**
 * @openapi
 * /tickets/{id}/cancel:
 *   post:
 *     tags: [Билеты]
 *     summary: Отменить один билет
 *     description: >
 *       Билет становится cancelled, место освобождается.
 *       Если в заказе не осталось активных билетов, заказ тоже отменяется.
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Билет отменён
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Ticket' }
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: Билет уже отменён
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/:id/cancel', validateId(), controller.cancel);

export default router;
