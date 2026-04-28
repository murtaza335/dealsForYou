import express, { Application } from "express";
import cors from "cors";
import dotenv from "dotenv";
import dealsRoutes from "./routes/deals.routes";
import analyticsRoutes from "./routes/analytics.routes";
import { notFoundHandler } from "./middlewares/notFoundHandler";
import { errorHandler } from "./middlewares/errorHandler";

dotenv.config();

const app: Application = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/deals", dealsRoutes);
app.use("/api/analytics", analyticsRoutes);

// Error middlewares
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
