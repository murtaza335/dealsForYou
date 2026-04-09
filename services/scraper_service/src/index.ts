import { connectDB } from "./config/db.js";
import { ENV } from "./config/env.js";
import { startJobs } from "./jobs/runScrapers.js";
import { ScraperService } from "./services/scraper.service.js";

//main starting point of the scraper service
const start = async () => {
  //connect to the database first before starting the scraper service
  await connectDB();

  //run the scraper once on startup to have some initial data in the database before the scheduled jobs start running 
  const scraperService = new ScraperService();

  console.log("Running scraper once on startup...");
  await scraperService.run();

 //calling the startjobs do that it run after each 30 min 
  console.log(`Scheduling scraper with interval: ${ENV.SCRAPER_INTERVAL}`);
  startJobs(ENV.SCRAPER_INTERVAL);
};

start().catch(error => {
  console.error("Failed to start scraper service:", error);
  process.exit(1);
});