// 404 для несуществующих маршрутов
export function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Маршрут не найден' });
}

// Соответствие кодов ошибок PostgreSQL HTTP-статусам
const PG_ERRORS = {
  '23505': [409, 'Запись с такими уникальными значениями уже существует'],
  '23503': [409, 'Операция нарушает связи между таблицами (внешний ключ)'],
  '23502': [400, 'Не заполнено обязательное поле'],
  '23514': [400, 'Значение не проходит ограничение CHECK'],
  '22P02': [400, 'Неверный формат данных'],
};

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  // Некорректный JSON в теле запроса
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Некорректный JSON в теле запроса' });
  }

  if (err.code && PG_ERRORS[err.code]) {
    const [status, message] = PG_ERRORS[err.code];
    return res.status(status).json({ error: message, detail: err.detail });
  }

  const status = err.status || 500;
  if (status >= 500) console.error(err);

  const body = { error: status >= 500 ? 'Внутренняя ошибка сервера' : err.message };
  if (err.details) body.details = err.details;
  return res.status(status).json(body);
}
