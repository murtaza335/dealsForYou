import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

export async function connectDb(): Promise<void> {
  await mongoose.connect(env.MONGO_URI_RECOMMENDATION_SERVICE);
  logger.info("Recommendation DB connected");
}