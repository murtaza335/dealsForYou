import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDb(): Promise<void> {
  await mongoose.connect(env.MONGO_URI_RECOMMENDATION_SERVICE);
  console.log("Recommendation DB connected");
}