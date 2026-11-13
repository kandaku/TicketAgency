import express from "express";
import swaggerUi from "swagger-ui-express";

import swaggerSpec from "./swagger.js";
import routes from "./routes/index.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(express.json());

// Документация: http://localhost:3000/api-docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api-docs.json", (req, res) => res.json(swaggerSpec));

app.use("/", routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
