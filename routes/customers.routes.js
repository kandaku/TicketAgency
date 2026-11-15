import { Router } from 'express';
import * as controller from '../controllers/customers.controller.js';
import { validateBody, validateId } from '../middleware/validate.js';

const router = Router();

const customerRules = {
  full_name: { type: 'string', required: true, max: 200 },
  email: { type: 'email', required: true, max: 150 },
  phone: { type: 'string', max: 30 },
};

/**
 * @openapi
 * components:
 *   schemas:
 *     CustomerInput:
 *       type: object
 *       required: [full_name, email]
 *       properties:
 *         full_name: { type: string, maxLength: 200, example: Иванов Иван Иванович }
 *         email: { type: string, format: email, maxLength: 150, example: ivanov@example.com }
 *         phone: { type: string, maxLength: 30, nullable: true, example: "+7 900 123-45-67" }
 *     Customer:
 *       allOf:
 *         - type: object
 *           properties:
 *             customer_id: { type: integer, example: 1 }
 *             registered_at: { type: string, example: "2026-11-14T00:23:11" }
 *         - $ref: '#/components/schemas/CustomerInput'
 */

/**
 * @openapi
 * /customers:
 *   get:
 *     tags: [Клиенты]
 *     summary: Список клиентов
 *     parameters:
 *       - in: query
 *         name: search
 *         description: Поиск по ФИО или email
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50, maximum: 200 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *     responses:
 *       200:
 *         description: Массив клиентов
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Customer' }
 *   post:
 *     tags: [Клиенты]
 *     summary: Зарегистрировать клиента
 *     description: Дата регистрации ставится автоматически.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CustomerInput' }
 *     responses:
 *       201:
 *         description: Клиент создан
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Customer' }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: Клиент с таким email уже существует
 */
router.get('/', controller.getAll);
router.post('/', validateBody(customerRules), controller.create);

/**
 * @openapi
 * /customers/{id}:
 *   get:
 *     tags: [Клиенты]
 *     summary: Получить клиента по ID
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Клиент
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Customer' }
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Клиенты]
 *     summary: Обновить клиента
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CustomerInput' }
 *     responses:
 *       200:
 *         description: Клиент обновлён
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Customer' }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: Email занят другим клиентом
 *   delete:
 *     tags: [Клиенты]
 *     summary: Удалить клиента
 *     description: Вернёт 409, если у клиента есть заказы.
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       204:
 *         description: Удалено
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: У клиента есть заказы
 */
router.get('/:id', validateId(), controller.getById);
router.put('/:id', validateId(), validateBody(customerRules), controller.update);
router.delete('/:id', validateId(), controller.remove);

export default router;
