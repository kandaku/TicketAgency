/**
 * Простая валидация тела запроса без внешних библиотек.
 *
 * Пример правил:
 *   {
 *     name:     { type: 'string',  required: true, max: 150 },
 *     capacity: { type: 'integer', required: true, min: 1 },
 *     seat_map: { type: 'string',  max: 255 },
 *   }
 *
 * Поддерживаемые типы: string, integer, number, datetime, email.
 */
function checkValue(value, rule) {
  switch (rule.type) {
    case "string":
      if (typeof value !== "string") return "должно быть строкой";
      if (rule.required && value.trim() === "") return "не может быть пустым";
      if (rule.max && value.length > rule.max)
        return `длина не более ${rule.max} символов`;
      return null;
    case "email":
      if (
        typeof value !== "string" ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      ) {
        return "должно быть корректным email";
      }
      if (rule.max && value.length > rule.max)
        return `длина не более ${rule.max} символов`;
      return null;
    case "integer":
      if (!Number.isInteger(value)) return "должно быть целым числом";
      if (rule.min !== undefined && value < rule.min)
        return `должно быть не менее ${rule.min}`;
      if (rule.max !== undefined && value > rule.max)
        return `должно быть не более ${rule.max}`;
      return null;
    case "number":
      if (typeof value !== "number" || !Number.isFinite(value))
        return "должно быть числом";
      if (rule.min !== undefined && value < rule.min)
        return `должно быть не менее ${rule.min}`;
      return null;
    case "datetime":
      if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
        return "должно быть датой в формате ISO 8601";
      }
      return null;
    default:
      return null;
  }
}

export function validateBody(rules) {
  return (req, res, next) => {
    const body = req.body || {};
    const errors = [];

    for (const [field, rule] of Object.entries(rules)) {
      const value = body[field];
      if (value === undefined || value === null) {
        if (rule.required) errors.push({ field, message: "обязательное поле" });
        continue;
      }
      const message = checkValue(value, rule);
      if (message) errors.push({ field, message });
    }

    if (errors.length) return next(new Error("Ошибка валидации", errors));
    return next();
  };
}

// Проверка числового параметра пути, например /venues/:id
export function validateId(param = "id") {
  return (req, res, next) => {
    const value = Number(req.params[param]);
    if (!Number.isInteger(value) || value <= 0) {
      return next(
        new Error(`Параметр ${param} должен быть положительным целым числом`),
      );
    }
    req.params[param] = value;
    return next();
  };
}
