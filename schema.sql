-- Физическая модель данных: продажа билетов на мероприятия
-- PostgreSQL 13+

CREATE TABLE IF NOT EXISTS customers (            -- Клиент
    customer_id        INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,   -- ID_Клиента
    full_name          VARCHAR(200) NOT NULL,                          -- ФИО
    email              VARCHAR(150) NOT NULL UNIQUE,                   -- Email
    phone              VARCHAR(30),                                    -- Телефон
    registered_at      TIMESTAMP    NOT NULL DEFAULT NOW()             -- Дата_Регистрации
);

CREATE TABLE IF NOT EXISTS venues (               -- Площадка
    venue_id           INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,   -- ID_Площадки
    name               VARCHAR(150) NOT NULL,                          -- Название
    address            VARCHAR(255) NOT NULL,                          -- Адрес
    capacity           INT          NOT NULL CHECK (capacity > 0),     -- Вместимость
    seat_map           VARCHAR(255)                                    -- Схема_Мест
);

CREATE TABLE IF NOT EXISTS seats (                -- Места
    seat_id            INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,   -- ID_Места
    venue_id           INT NOT NULL REFERENCES venues(venue_id) ON DELETE CASCADE, -- ID_Площадки
    row_number         INT NOT NULL CHECK (row_number > 0),            -- Ряд
    seat_number        INT NOT NULL CHECK (seat_number > 0),           -- Номер
    seat_type          VARCHAR(50)  NOT NULL,                          -- Тип_Места
    UNIQUE (venue_id, row_number, seat_number)
);

CREATE TABLE IF NOT EXISTS events (               -- Мероприятие
    event_id           INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,   -- ID_Мероприятия
    name               VARCHAR(200) NOT NULL,                          -- Название
    event_date         TIMESTAMP    NOT NULL,                          -- Дата
    venue_id           INT NOT NULL REFERENCES venues(venue_id)        -- ID_Площадки
);

CREATE TABLE IF NOT EXISTS ticket_types (         -- Тип_Билета
    ticket_type_id     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,   -- ID_Типа
    name               VARCHAR(100) NOT NULL,                          -- Название
    price              DECIMAL(10,2) NOT NULL CHECK (price >= 0),      -- Цена
    event_id           INT NOT NULL REFERENCES events(event_id) ON DELETE CASCADE -- ID_Мероприятия
);

CREATE TABLE IF NOT EXISTS orders (               -- Заказ
    order_id           INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,   -- ID_Заказа
    order_date         TIMESTAMP    NOT NULL DEFAULT NOW(),            -- Дата_Заказа
    status             VARCHAR(50)  NOT NULL DEFAULT 'new',            -- Статус
    customer_id        INT NOT NULL REFERENCES customers(customer_id)  -- ID_Клиента
);

CREATE TABLE IF NOT EXISTS tickets (              -- Билет
    ticket_id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,   -- ID_Билета
    seat_id            INT REFERENCES seats(seat_id),                  -- ID_Места
    status             VARCHAR(50)  NOT NULL DEFAULT 'available',      -- Статус
    ticket_type_id     INT REFERENCES ticket_types(ticket_type_id),    -- ID_Типа
    order_id           INT REFERENCES orders(order_id)                 -- ID_Заказа
);

-- Индексы по внешним ключам
CREATE INDEX IF NOT EXISTS idx_seats_venue         ON seats(venue_id);
CREATE INDEX IF NOT EXISTS idx_events_venue        ON events(venue_id);
CREATE INDEX IF NOT EXISTS idx_ticket_types_event  ON ticket_types(event_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer     ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_tickets_seat        ON tickets(seat_id);
CREATE INDEX IF NOT EXISTS idx_tickets_type        ON tickets(ticket_type_id);
CREATE INDEX IF NOT EXISTS idx_tickets_order       ON tickets(order_id);