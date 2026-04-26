import cron from "node-cron";
import { MetricsBatchService } from "../services/metricsBatch.service.js";

export function startMetricsCron() {
  // every 30 minutes
  cron.schedule("*/30 * * * *", async () => {
    console.log("Running metrics batch job...");

    try {
      await MetricsBatchService.processBatch();
    } catch (error) {
      console.error("Metrics batch failed:", error);
    }
  });
}