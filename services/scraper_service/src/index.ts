import { connectDB } from "./config/db.js";
import { ENV } from "./config/env.js";
import { startHttpServer } from "./http.js";
import { startJobs } from "./jobs/runScrapers.js";
import { ScraperService } from "./services/scraper.service.js";
import { startScraperTriggerQueue } from "./jobs/scraperTrigger.job.js";
import { scraperTriggerQueue } from "./services/scraperTriggerQueue.js";


//main starting point of the scraper service
const start = async () => {
  //connect to the database first before starting the scraper service
  await connectDB();

  //run the scraper once on startup to have some initial data in the database before the scheduled jobs start running 
  const scraperService = new ScraperService();

  console.log("Running scraper once on startup...");
  await scraperService.run();


  //calling the startjobs do that it run after each 24 hours (1440 mins)
  console.log(`Scheduling scraper with interval: ${ENV.SCRAPER_INTERVAL}`);

  startJobs(ENV.SCRAPER_INTERVAL);
  
  // Start the scraper trigger queue to listen for scheduled scraper triggers
  console.log("Starting scraper trigger queue...");
   try {
     await startScraperTriggerQueue();
   } catch (error) {
     console.error("Failed to start scraper trigger queue:", error);
   }

   startHttpServer();
};

start().catch(error => {
  console.error("Failed to start scraper service:", error);
  process.exit(1);
});