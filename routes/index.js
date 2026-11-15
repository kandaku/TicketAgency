import { Router } from "express";

import healthRoutes from "./health.routes.js";
import venuesRoutes from "./venues.routes.js";
import seatsRoutes from "./seats.routes.js";
import customersRoutes from "./customers.routes.js";
import eventsRoutes from "./events.routes.js";
import eventSeatsRoutes from "./eventSeats.routes.js";
import ticketTypesRoutes from "./ticketTypes.routes.js";
import ordersRoutes from "./orders.routes.js";
import ticketsRoutes from "./tickets.routes.js";

const router = Router();

router.use(healthRoutes);
router.use("/venues", venuesRoutes);
router.use("/seats", seatsRoutes);
router.use("/customers", customersRoutes);
router.use("/events", eventsRoutes);
router.use("/events", eventSeatsRoutes);
router.use("/ticket-types", ticketTypesRoutes);
router.use("/orders", ordersRoutes);
router.use("/tickets", ticketsRoutes);

export default router;
