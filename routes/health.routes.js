import { Router } from 'express';
import db from '../db.js';

const router = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Служебные]
 *     summary: Проверка сервера и подключения к БД
 *     responses:
 *       200:
 *         description: Сервер и БД работают
 *       500:
 *         description: Нет подключения к БД
 */
router.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', database: 'disconnected', message: err.message });
  }
});

export default router;
