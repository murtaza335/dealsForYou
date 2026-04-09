import mongoose from "mongoose";
import { ENV } from "./env.js";

//connecting the scraper service to the deals database cluster0
export const connectDB = async () => {
  try {
    await mongoose.connect(ENV.MONGO_URI);

    console.log(" MongoDB connected successfully");
  } catch (error) {
    console.error(" MongoDB connection failed:", error);
    process.exit(1);
  }
};