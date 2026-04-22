import cron from "node-cron";
import { ScraperService } from "../services/scraper.service.js";

// it will run the scraper every 1440 mins (24 hours)
const scraperService = new ScraperService();

export const startJobs = (interval ="0 0 * * *") => {
  cron.schedule(interval, async () => {
    console.log("⏰ Running scheduled scraper...");
    await scraperService.run();
  });
};