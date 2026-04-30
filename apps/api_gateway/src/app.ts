import express, { Application } from "express";
import cors from "cors";
import dotenv from "dotenv";
import dealsRoutes from "./routes/deals.routes";
import analyticsRoutes from "./routes/analytics.routes";
import { notFoundHandler } from "./middlewares/notFoundHandler";
import { errorHandler } from "./middlewares/errorHandler";
import { clerkMiddleware } from "@clerk/express";

dotenv.config();

const app: Application = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  clerkMiddleware({
    publishableKey:
      process.env.CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.CLERK_SECRET_KEY,
  })
);

// Routes
app.use("/api/deals", dealsRoutes);
app.use("/api/analytics", analyticsRoutes);

// Error middlewares
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
