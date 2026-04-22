import cors from "cors";
import dotenv from "dotenv";
import express, { type Application } from "express";
import { notFoundHandler } from "./middlewares/notFoundHandler.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { trackRouter } from "./routes/track.routes.js";
import recommendationRouter from "./routes/recommendation.routes.js";

dotenv.config();

const app: Application = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/track", trackRouter);
app.use("/api", recommendationRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;