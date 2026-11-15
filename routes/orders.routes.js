import { Router } from 'express';
import * as controller from '../controllers/orders.controller.js';
import { validateId } from '../middleware/validate.js';

const router = Router();

const MAX_ITEMS = 20;
const isPositiveInt = (v) => Number.isInteger(v) && v > 0;

// Проверка тела POST /orders: { customer_id, items: [{ event_id, seat_id }] }
function validateOrderBody(req, res, next) {
  const { customer_id, items } = req.body ?? {};
  const details = [];

  if (!isPositiveInt(customer_id)) {
    details.push({ field: 'customer_id', message: 'обязательное положительное целое число' });
  }

  if (!Array.isArray(items) || items.length === 0) {
    details.push({ field: 'items', message: 'нужен непустой массив' });
  } else if (items.length > MAX_ITEMS) {
    details.push({ field: 'items', message: `не более ${MAX_ITEMS} билетов в одном заказе` });
  } else {
    items.forEach((item, i) => {
      if (!isPositiveInt(item?.event_id)) {
        details.push({ field: `items[${i}].event_id`, message: 'обязательное положительное целое число' });
      }
      if (!isPositiveInt(item?.seat_id)) {
        details.push({ field: `items[${i}].seat_id`, message: 'обязательное положительное целое число' });
      }
    });
  }

  if (details.length) return res.status(400).json({ error: 'Ошибка валидации', details });
  return next();
}

/**
 * @openapi
 * components:
 *   schemas:
 *     OrderItemInput:
 *       type: object
 *       required: [event_id, seat_id]
 *       properties:
 *         event_id: { type: integer, description: Мероприятие, на которое покупается место, example: 1 }
 *         seat_id:
 *           type: integer
 *           description: Место. По его типу (seat_type) и мероприятию сервер подбирает тип билета и цену.
 *           example: 15
 *     OrderCreateInput:
 *       type: object
 *       required: [customer_id, items]
 *       properties:
 *         customer_id: { type: integer, example: 1 }
 *         items:
 *           type: array
 *           minItems: 1
 *           maxItems: 20
 *           items: { $ref: '#/components/schemas/OrderItemInput' }
 *     OrderSummary:
 *       type: object
 *       properties:
 *         order_id: { type: integer, example: 1 }
 *         order_date: { type: string, example: "2026-11-14T12:30:00" }
 *         status: { type: string, enum: [new, paid, cancelled], example: new }
 *         customer_id: { type: integer, example: 1 }
 *         tickets_count: { type: integer, description: Количество неотменённых билетов, example: 2 }
 *         total: { type: number, description: Сумма неотменённых билетов, example: 6500 }
 *     Ticket:
 *       type: object
 *       properties:
 *         ticket_id: { type: integer, example: 1 }
 *         status: { type: string, enum: [reserved, sold, cancelled], example: reserved }
 *         order_id: { type: integer, example: 1 }
 *         event_id: { type: integer, example: 1 }
 *         event_name: { type: string, example: Концерт симфонического оркестра }
 *         event_date: { type: string, example: "2026-12-20T19:00:00" }
 *         seat_id: { type: integer, example: 15 }
 *         row_number: { type: integer, example: 1 }
 *         seat_number: { type: integer, example: 15 }
 *         seat_type: { type: string, example: Партер }
 *         ticket_type_id: { type: integer, example: 1 }
 *         ticket_type_name: { type: string, example: VIP }
 *         price: { type: number, example: 5000 }
 *     Order:
 *       type: object
 *       properties:
 *         order_id: { type: integer, example: 1 }
 *         order_date: { type: string, example: "2026-11-14T12:30:00" }
 *         status: { type: string, enum: [new, paid, cancelled], example: new }
 *         customer_id: { type: integer, example: 1 }
 *         customer_name: { type: string, example: Иванов Иван Иванович }
 *         total: { type: number, description: Сумма неотменённых билетов, example: 6500 }
 *         tickets:
 *           type: array
 *           items: { $ref: '#/components/schemas/Ticket' }
 */

/**
 * @openapi
 * /orders:
 *   get:
 *     tags: [Заказы]
 *     summary: Список заказов
 *     description: От новых к старым. В каждом заказе количество билетов и сумма (без отменённых).
 *     parameters:
 *       - in: query
 *         name: customer_id
 *         schema: { type: integer }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [new, paid, cancelled] }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50, maximum: 200 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *     responses:
 *       200:
 *         description: Массив заказов
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/OrderSummary' }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *   post:
 *     tags: [Заказы]
 *     summary: Создать заказ с билетами
 *     description: >
 *       Создаёт заказ (статус new) и билеты на выбранные места (статус reserved) одной транзакцией:
 *       либо всё, либо ничего. В позиции передаются мероприятие и место, тип билета и цена
 *       определяются сервером: ищется тип билета мероприятия с тем же типом места, что у места.
 *       Цена фиксируется в билете в момент заказа.
 *       Проверяется, что клиент, мероприятия и места существуют, места относятся к площадке мероприятия,
 *       не повторяются и не заняты другими неотменёнными билетами, мероприятие ещё не прошло,
 *       а для типа места есть тип билета.
 *       Параллельные заказы на одно мероприятие выполняются по очереди, двойная продажа места невозможна.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/OrderCreateInput' }
 *     responses:
 *       201:
 *         description: Заказ создан
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Order' }
 *       400:
 *         description: Ошибка валидации, клиент, мероприятие или место не найдены, место с другой площадки
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       409:
 *         description: Места уже заняты (в details список seat_id и event_id), мероприятие прошло или на тип места нет билетов
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get('/', controller.getAll);
router.post('/', validateOrderBody, controller.create);

/**
 * @openapi
 * /orders/{id}:
 *   get:
 *     tags: [Заказы]
 *     summary: Получить заказ с билетами
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Заказ
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Order' }
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', validateId(), controller.getById);

/**
 * @openapi
 * /orders/{id}/pay:
 *   post:
 *     tags: [Заказы]
 *     summary: Оплатить заказ
 *     description: Заказ new -> paid, его билеты reserved -> sold.
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Заказ оплачен
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Order' }
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: Заказ не в статусе new
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/:id/pay', validateId(), controller.pay);

/**
 * @openapi
 * /orders/{id}/cancel:
 *   post:
 *     tags: [Заказы]
 *     summary: Отменить заказ
 *     description: Заказ new или paid -> cancelled, все его билеты -> cancelled. Места становятся свободными.
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Заказ отменён
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Order' }
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: Заказ уже отменён
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/:id/cancel', validateId(), controller.cancel);

export default router;
