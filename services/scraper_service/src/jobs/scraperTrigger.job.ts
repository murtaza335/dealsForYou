import { scraperTriggerQueue } from "../services/scraperTriggerQueue.js";
import { ScraperService } from "../services/scraper.service.js";
import { ScraperControlRepository } from "../repositories/scraperControl.repository.js";
import { getNextRunTime, getDelay } from "../utils/scheduler.utils.js";
import { ScraperStateRepository} from "../repositories/scraperState.repository.js";

const scraperService = new ScraperService();
const scraperSourceRepo = new ScraperControlRepository();
const scraperStateRepo = new ScraperStateRepository();


export async function startScraperTriggerQueue(): Promise<void> {
  await scraperTriggerQueue.init();

  // 🔁 Consumer 
  await scraperTriggerQueue.consume(async ({ slug }) => {
    console.log(`Trigger received for ${slug}`);

    //check the last run before running the scrapper to avoid unnecessary run it ignore if it with in the 2 min
    const lastruntime = await scraperStateRepo.getLastRunTimeBySlug(slug);
    console .log(`Last run time for ${slug}: ${lastruntime}`);
    if(lastruntime){
      const now = new Date();
      const diff = now.getTime() - lastruntime.getTime();
      if(diff < 2*60*1000){ // 2 min
        console.log(`Skipping ${slug} as it was run just ${Math.round(diff/1000)}s ago`);
        return;
      }
    }
    await scraperService.runSingle(slug);

    // Reschedule next run
    const source = await scraperSourceRepo.getBySlug(slug);

    if (!source?.runTimes?.length) return;

    const nextRun = getNextRunTime(source.runTimes);
    const delay = getDelay(nextRun);

    await scraperTriggerQueue.scheduleScraper(slug, delay);
  });

  // 🚀 Initial scheduling
  const sources = await scraperSourceRepo.listActiveScraperSources();

  
  for (const source of sources) {
    if (!source.runTimes?.length) continue;

    const nextRun = getNextRunTime(source.runTimes);
    const delay = getDelay(nextRun);

    await scraperTriggerQueue.scheduleScraper(source.slug, delay);
  }

  console.log("Scraper trigger queue started");
}