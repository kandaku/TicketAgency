// Пагинация: ?limit=50&offset=0 (limit не более 200)
export function getPagination(req) {
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  return { limit, offset };
}

// Необязательный числовой фильтр из query, например ?venue_id=3
//   параметр не передан         -> null
//   передан, но не число > 0    -> NaN  (контроллер отвечает 400)
//   корректное значение         -> число
export function getOptionalId(req, name) {
  const raw = req.query[name];
  if (raw === undefined || raw === '') return null;

  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : NaN;
}
