import mongoose from "mongoose";
import { connectDb } from "./config/db.js";
import { startServer } from "./server.js";
import { logger } from "./utils/logger.js";
import "./models/dealEmbedding.model.js";
import "./models/userEvent.model.js";
import "./models/userProfile.mode.js";
import "./models/userMoodProfile.model.js";
import { initRabbitMQSubscriber, closeSubscriber } from "./services/rabbitmq.subscriber.js";

async function bootstrap(): Promise<void> {
  try {
    logger.info("Starting recommendation service bootstrap...");
    
    await connectDb();
    logger.info("Database connection established successfully");
    
    await mongoose.connection.createCollection("deal_embeddings");
    await mongoose.connection.createCollection("user_events");
    await mongoose.connection.createCollection("user_profiles");
    await mongoose.connection.createCollection("user_mood_profiles");
    logger.info("Collections created/verified successfully");

    const server = startServer();
    logger.info("HTTP server started successfully");
    
    logger.info("Initializing RabbitMQ subscriber...");
    try {
      await initRabbitMQSubscriber();
      logger.info("RabbitMQ subscriber initialized successfully");
    } catch (err) {
      logger.error("Failed to initialize RabbitMQ subscriber", err);
      process.exit(1);
    }

    const shutdown = (signal: string) => {
      logger.info(`${signal} signal received. Starting graceful shutdown...`);

      server.close(async () => {
        try {
          await closeSubscriber();
          logger.info("RabbitMQ subscriber closed");
          
          await mongoose.connection.close();
          logger.info("Database connection closed");
          
          logger.info("Recommendation service shutdown completed successfully");
          process.exit(0);
        } catch (error) {
          logger.error("Error during graceful shutdown", error);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.warn("Graceful shutdown timeout reached. Forcing exit...");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));

    mongoose.connection.on("error", (error) => {
      logger.error("MongoDB connection error", error);
    });

    logger.info("Recommendation service bootstrap completed successfully");
  } catch (err) {
    logger.error("Failed during service bootstrap", err);
    process.exit(1);
  }
}


bootstrap().catch((error) => {
  console.error("Failed to start recommendation service:", error);
  process.exit(1);
});
