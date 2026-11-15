import db from '../db.js';

// Бизнес-ошибка внутри транзакции: { error: { status, message, details } }
export const fail = (status, message, details) => ({ error: { status, message, details } });

// Отправляет бизнес-ошибку клиенту
export const sendError = (res, error) =>
  res.status(error.status).json({
    error: error.message,
    ...(error.details ? { details: error.details } : {}),
  });

/**
 * Выполняет fn(client) в одной транзакции.
 * fn возвращает { result } (тогда COMMIT) или fail(...) (тогда ROLLBACK).
 * Непредвиденные ошибки откатывают транзакцию и пробрасываются в errorHandler.
 */
export async function withTransaction(fn) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const outcome = await fn(client);
    await client.query(outcome.error ? 'ROLLBACK' : 'COMMIT');
    return outcome;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
