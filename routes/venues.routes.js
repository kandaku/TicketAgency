import { Router } from 'express';
import * as controller from '../controllers/venues.controller.js';
import { validateBody, validateId } from '../middleware/validate.js';

const router = Router();

const venueRules = {
  name: { type: 'string', required: true, max: 150 },
  address: { type: 'string', required: true, max: 255 },
  capacity: { type: 'integer', required: true, min: 1 },
  seat_map: { type: 'string', max: 255 },
};

/**
 * @openapi
 * /venues:
 *   get:
 *     tags: [Площадки]
 *     summary: Список площадок
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50, maximum: 200 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *     responses:
 *       200:
 *         description: Массив площадок
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Venue' }
 *   post:
 *     tags: [Площадки]
 *     summary: Создать площадку
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/VenueInput' }
 *     responses:
 *       201:
 *         description: Площадка создана
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Venue' }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.get('/', controller.getAll);
router.post('/', validateBody(venueRules), controller.create);

/**
 * @openapi
 * /venues/{id}:
 *   get:
 *     tags: [Площадки]
 *     summary: Получить площадку по ID
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Площадка
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Venue' }
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Площадки]
 *     summary: Обновить площадку
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/VenueInput' }
 *     responses:
 *       200:
 *         description: Площадка обновлена
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Venue' }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [Площадки]
 *     summary: Удалить площадку
 *     description: Вернёт 409, если на площадке есть мероприятия.
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       204:
 *         description: Удалено
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: Есть связанные записи
 */
router.get('/:id', validateId(), controller.getById);
router.put('/:id', validateId(), validateBody(venueRules), controller.update);
router.delete('/:id', validateId(), controller.remove);

export default router;
