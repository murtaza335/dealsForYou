import mongoose from "mongoose";
import { connectDb } from "./config/db.js";
import { startServer } from "./server.js";
import "./models/dealEmbedding.model.js";
import "./models/userEvent.model.js";
import "./models/userProfile.mode.js";
import { initRabbitMQSubscriber, closeSubscriber } from "./services/rabbitmq.subscriber.js";

async function bootstrap(): Promise<void> {
  await connectDb();
  
  await mongoose.connection.createCollection("deal_embeddings");
  await mongoose.connection.createCollection("user_events");
  await mongoose.connection.createCollection("user_profiles");

  const server = startServer();
    // Initialize RabbitMQ subscriber for deal embeddings
  try {
    await initRabbitMQSubscriber();
  } catch (err) {
    console.error('Failed to init RabbitMQ subscriber:', err);
    process.exit(1);
  }

  const shutdown = (signal: string) => {
    console.log(`${signal} received. Shutting down recommendation service...`);

    server.close(async () => {
      try {
        await closeSubscriber();
        await mongoose.connection.close();
        console.log("HTTP server closed and DB connection terminated.");
        process.exit(0);
      } catch (error) {
        console.error("Error during shutdown:", error);
        process.exit(1);
      }
    });

    
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  mongoose.connection.on("error", (error) => {
    console.error("MongoDB connection error:", error);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start recommendation service:", error);
  process.exit(1);
});