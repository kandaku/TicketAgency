import { Router } from 'express';
import * as controller from '../controllers/ticketTypes.controller.js';
import { validateBody, validateId } from '../middleware/validate.js';

const router = Router();

const createRules = {
  name: { type: 'string', required: true, max: 100 },
  price: { type: 'number', required: true, min: 0 },
  event_id: { type: 'integer', required: true, min: 1 },
  seat_type: { type: 'string', required: true, max: 50 },
};

const updateRules = {
  name: { type: 'string', required: true, max: 100 },
  price: { type: 'number', required: true, min: 0 },
};

// Колонка "Цена" имеет тип numeric(10,2): не более 8 цифр до запятой и 2 после
function checkPrice(req, res, next) {
  const { price } = req.body ?? {};
  const invalid = (message) =>
    res.status(400).json({ error: 'Ошибка валидации', details: [{ field: 'price', message }] });

  if (typeof price === 'number') {
    if (price > 99999999.99) return invalid('не более 99999999.99');
    if (Math.abs(price * 100 - Math.round(price * 100)) > 1e-6) {
      return invalid('не более двух знаков после запятой');
    }
  }
  return next();
}

/**
 * @openapi
 * components:
 *   schemas:
 *     TicketTypeInput:
 *       type: object
 *       required: [name, price, event_id, seat_type]
 *       properties:
 *         name: { type: string, maxLength: 100, example: VIP }
 *         price: { type: number, minimum: 0, example: 5000 }
 *         event_id: { type: integer, minimum: 1, example: 1 }
 *         seat_type:
 *           type: string
 *           maxLength: 50
 *           description: >
 *             Для каких мест действует этот тип билета (значение seat_type у мест, например VIP или Партер).
 *             У одного мероприятия не может быть двух типов билета на один тип места.
 *           example: VIP
 *     TicketTypeUpdate:
 *       type: object
 *       required: [name, price]
 *       properties:
 *         name: { type: string, maxLength: 100, example: VIP }
 *         price: { type: number, minimum: 0, example: 5500 }
 *     TicketType:
 *       allOf:
 *         - type: object
 *           properties:
 *             ticket_type_id: { type: integer, example: 1 }
 *         - $ref: '#/components/schemas/TicketTypeInput'
 */

/**
 * @openapi
 * /ticket-types:
 *   get:
 *     tags: [Типы билетов]
 *     summary: Список типов билетов
 *     parameters:
 *       - in: query
 *         name: event_id
 *         description: Только типы билетов этого мероприятия
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50, maximum: 200 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *     responses:
 *       200:
 *         description: Массив типов билетов
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/TicketType' }
 *   post:
 *     tags: [Типы билетов]
 *     summary: Создать тип билета для мероприятия
 *     description: >
 *       Тип билета действует на все места мероприятия с указанным seat_type и задаёт их цену.
 *       Тип места у созданного типа билета изменить нельзя.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/TicketTypeInput' }
 *     responses:
 *       201:
 *         description: Тип билета создан
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/TicketType' }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: У мероприятия уже есть тип билета для этого типа мест
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get('/', controller.getAll);
router.post('/', validateBody(createRules), checkPrice, controller.create);

/**
 * @openapi
 * /ticket-types/{id}:
 *   get:
 *     tags: [Типы билетов]
 *     summary: Получить тип билета по ID
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Тип билета
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/TicketType' }
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Типы билетов]
 *     summary: Изменить название и цену
 *     description: Мероприятие у типа билета менять нельзя.
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/TicketTypeUpdate' }
 *     responses:
 *       200:
 *         description: Тип билета обновлён
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/TicketType' }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [Типы билетов]
 *     summary: Удалить тип билета
 *     description: Вернёт 409, если по этому типу уже есть билеты.
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       204:
 *         description: Удалено
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: По типу есть билеты
 */
router.get('/:id', validateId(), controller.getById);
router.put('/:id', validateId(), validateBody(updateRules), checkPrice, controller.update);
router.delete('/:id', validateId(), controller.remove);

export default router;
