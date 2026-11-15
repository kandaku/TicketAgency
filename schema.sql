-- Физическая модель данных: продажа билетов на мероприятия
-- PostgreSQL 13+. Структура соответствует рабочей базе (дамп ticket.sql).
-- Применить: npm run db:init

CREATE TABLE IF NOT EXISTS "Клиент" (
    "id_Клиента"       SERIAL PRIMARY KEY,
    "ФИО"              VARCHAR(200) NOT NULL,
    email              VARCHAR(150) NOT NULL,
    "Телефон"          VARCHAR(30),
    "Дата_Регистрации" TIMESTAMP    NOT NULL
);

CREATE TABLE IF NOT EXISTS "Площадка" (
    "id_Площадки"      SERIAL PRIMARY KEY,
    "Название"         VARCHAR(150) NOT NULL,
    "Адрес"            VARCHAR(255) NOT NULL,
    "Вместимость"      INT          NOT NULL,
    "Схема_Мест"       VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS "Места" (
    "id_Места"         SERIAL PRIMARY KEY,
    "id_Площадки"      INT NOT NULL REFERENCES "Площадка"("id_Площадки"),
    "Ряд"              INT NOT NULL,
    "Номер"            INT NOT NULL,
    "Тип_Места"        VARCHAR(50) NOT NULL        -- VIP, Партер, Стандарт...
);

CREATE TABLE IF NOT EXISTS "Мероприятие" (
    "id_Мероприятия"   SERIAL PRIMARY KEY,
    "Название"         VARCHAR(200) NOT NULL,
    "Дата"             TIMESTAMP    NOT NULL,
    "id_Площадки"      INT NOT NULL REFERENCES "Площадка"("id_Площадки")
);

-- Тип билета действует на все места мероприятия с указанным "Тип_Места" и задаёт их цену.
-- Для пары (мероприятие, тип места) может быть только один тип билета.
CREATE TABLE IF NOT EXISTS "Тип_Билета" (
    "id_Типа"          SERIAL PRIMARY KEY,
    "Название"         VARCHAR(100)  NOT NULL,
    "Цена"             NUMERIC(10,2) NOT NULL,
    "id_Мероприятия"   INT NOT NULL REFERENCES "Мероприятие"("id_Мероприятия"),
    "Тип_Места"        VARCHAR(50)   NOT NULL,
    CONSTRAINT ticket_types_event_seat_type_key UNIQUE ("id_Мероприятия", "Тип_Места")
);

CREATE TABLE IF NOT EXISTS "Заказ" (
    "id_Заказа"        SERIAL PRIMARY KEY,
    "Дата_Заказа"      TIMESTAMP   NOT NULL,
    "Статус"           VARCHAR(50) NOT NULL,
    "id_Клиента"       INT NOT NULL REFERENCES "Клиент"("id_Клиента")
);

-- "Цена" копируется из типа билета в момент заказа и дальше не меняется
CREATE TABLE IF NOT EXISTS "Билет" (
    "id_Билета"        SERIAL PRIMARY KEY,
    "id_Места"         INT NOT NULL REFERENCES "Места"("id_Места"),
    "Статус"           VARCHAR(50) NOT NULL,
    "id_Мероприятия"   INT NOT NULL REFERENCES "Мероприятие"("id_Мероприятия"),
    "id_Типа"          INT NOT NULL REFERENCES "Тип_Билета"("id_Типа"),
    "id_Заказа"        INT NOT NULL REFERENCES "Заказ"("id_Заказа"),
    "Цена"             NUMERIC(10,2) NOT NULL
);
