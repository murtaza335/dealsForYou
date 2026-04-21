import cron from "node-cron";
import { ScraperService } from "../services/scraper.service.js";

// it will run the scraper every 120 mins
const scraperService = new ScraperService();

export const startJobs = (interval = "*/120 * * * *") => {
  cron.schedule(interval, async () => {
    console.log("⏰ Running scheduled scraper...");
    await scraperService.run();
  });
};