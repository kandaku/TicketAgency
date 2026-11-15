import path from "node:path";
import { fileURLToPath } from "node:url";
import swaggerJsdoc from "swagger-jsdoc";

// В ES-модулях нет __dirname, получаем его из import.meta.url
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = process.env.PORT || 3000;

const spec = swaggerJsdoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Ticket Service API",
      version: "1.0.0",
      description: "REST API сервиса продажи билетов на мероприятия",
    },
    servers: [{ url: `/`, description: "Текущий сервер" }],
    tags: [{ name: "Служебные" }, { name: "Площадки" }],
    components: {
      parameters: {
        IdParam: {
          in: "path",
          name: "id",
          required: true,
          schema: { type: "integer", minimum: 1 },
          description: "Идентификатор записи",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: { type: "string", example: "Ошибка валидации" },
            details: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: { type: "string", example: "capacity" },
                  message: { type: "string", example: "обязательное поле" },
                },
              },
            },
          },
        },
        VenueInput: {
          type: "object",
          required: ["name", "address", "capacity"],
          properties: {
            name: {
              type: "string",
              maxLength: 150,
              example: "Крокус Сити Холл",
            },
            address: {
              type: "string",
              maxLength: 255,
              example: "Москва, 66-й км МКАД",
            },
            capacity: { type: "integer", minimum: 1, example: 6200 },
            seat_map: {
              type: "string",
              maxLength: 255,
              nullable: true,
              example: "maps/crocus.svg",
            },
          },
        },
        Venue: {
          allOf: [
            {
              type: "object",
              properties: { venue_id: { type: "integer", example: 1 } },
            },
            { $ref: "#/components/schemas/VenueInput" },
          ],
        },
      },
      responses: {
        NotFound: {
          description: "Запись не найдена",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        ValidationError: {
          description: "Ошибка валидации",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
      },
    },
  },
  apis: [path.join(__dirname, "routes", "*.js").replace(/\\/g, "/")],
});

export default spec;
