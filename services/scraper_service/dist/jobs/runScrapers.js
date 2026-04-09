import cron from "node-cron";
import { ScraperService } from "../services/scraper.service.js";
const scraperService = new ScraperService();
export const startJobs = (interval = "*/30 * * * *") => {
    cron.schedule(interval, async () => {
        console.log("⏰ Running scheduled scraper...");
        await scraperService.run();
    });
};
