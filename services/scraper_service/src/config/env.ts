import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || "5001",

  MONGO_URI: process.env.MONGO_URI || "",

  NODE_ENV: process.env.NODE_ENV || "development",

  SCRAPER_INTERVAL: process.env.SCRAPER_INTERVAL || "*/30 * * * *" // every 30 min
};