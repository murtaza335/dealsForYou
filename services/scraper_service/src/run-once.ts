import { connectDB } from "./config/db.js";
import { ScraperService } from "./services/scraper.service.js";

// just test file for running the scraper once
const runOnce = async () => {
  await connectDB();
  const scraperService = new ScraperService();
  await scraperService.run();
  process.exit(0);
};

runOnce().catch(error => {
  console.error("Run-once failed:", error);
  process.exit(1);
});
