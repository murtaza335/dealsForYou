import { connectDB } from "./config/db.js";
import { ENV } from "./config/env.js";
import { startJobs } from "./jobs/runScrapers.js";
import { ScraperService } from "./services/scraper.service.js";
const start = async () => {
    await connectDB();
    const scraperService = new ScraperService();
    console.log("Running scraper once on startup...");
    await scraperService.run();
    console.log(`Scheduling scraper with interval: ${ENV.SCRAPER_INTERVAL}`);
    startJobs(ENV.SCRAPER_INTERVAL);
};
start().catch(error => {
    console.error("Failed to start scraper service:", error);
    process.exit(1);
});
