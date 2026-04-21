import { connectDB } from "./config/db.js";
import { startServer } from "./server.js";

const start = async () => {
  await connectDB();
  startServer();
};

start().catch((error) => {
  console.error("Failed to start recommendation service:", error);
  process.exit(1);
});