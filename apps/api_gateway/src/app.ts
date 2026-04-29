import express, { Application } from "express";
import cors from "cors";
import dotenv from "dotenv";
import dealsRoutes from "./routes/deals.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import userRoutes from "./routes/user.routes.js";
import brandAdminRoutes from "./routes/brandAdmin.routes.js";
import appAdminRoutes from "./routes/appAdmin.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import { notFoundHandler } from "./middlewares/notFoundHandler.js";
import { errorHandler } from "./middlewares/errorHandler.js";

dotenv.config();

const app: Application = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: "12mb" }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/deals", dealsRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/users", userRoutes);
app.use("/api/brand-admin", brandAdminRoutes);
app.use("/api/app-admin", appAdminRoutes);
app.use("/api/uploads", uploadRoutes);

// Error middlewares
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
