import db from "../db.js";

const COLUMNS = "id_Площадки, Название, Адрес, Вместимость, Схема_Мест";

export const getAll = async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Number(req.query.offset) || 0;

  const { rows } = await db.query(
    `SELECT ${COLUMNS} FROM Площадка ORDER BY id_Площадки LIMIT $1 OFFSET $2`,
    [limit, offset],
  );
  res.json(rows);
};

export const getById = async (req, res) => {
  const { rows } = await db.query(
    `SELECT ${COLUMNS} FROM Площадка WHERE id_Площадки = $1`,
    [req.params.id],
  );
  if (!rows.length) throw new Error("Площадка не найдена");
  res.json(rows[0]);
};

export const create = async (req, res) => {
  const { name, address, capacity, seat_map = null } = req.body;
  const { rows } = await db.query(
    `INSERT INTO Площадка (Название, Адрес, Вместимость, Схема_Мест)
     VALUES ($1, $2, $3, $4)
     RETURNING ${COLUMNS}`,
    [name, address, capacity, seat_map],
  );
  res.status(201).json(rows[0]);
};

export const update = async (req, res) => {
  const { name, address, capacity, seat_map = null } = req.body;
  const { rows } = await db.query(
    `UPDATE Площадка
        SET Название = $1, Адрес = $2, Вместимость = $3, Схема_Мест = $4
      WHERE id_Площадки = $5
      RETURNING ${COLUMNS}`,
    [name, address, capacity, seat_map, req.params.id],
  );
  if (!rows.length) throw new Error("Площадка не найдена");
  res.json(rows[0]);
};

export const remove = async (req, res) => {
  const { rowCount } = await db.query(
    "DELETE FROM Площадка WHERE id_Площадки = $1",
    [req.params.id],
  );
  if (!rowCount) throw new Error("Площадка не найдена");
  res.status(204).send();
};
