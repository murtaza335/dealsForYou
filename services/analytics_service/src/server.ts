import dotenv from "dotenv";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { startMetricsCron } from "./scheduler/metrics.scheduler.js";


dotenv.config();

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();

  startMetricsCron();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

start();