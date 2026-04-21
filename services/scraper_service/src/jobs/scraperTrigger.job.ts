import { scraperTriggerQueue } from "../services/scraperTriggerQueue.js";
import { ScraperService } from "../services/scraper.service.js";
import { ScraperControlRepository } from "../repositories/scraperControl.repository.js";
import { getNextRunTime, getDelay } from "../utils/scheduler.utils.js";

const scraperService = new ScraperService();
const scraperSourceRepo = new ScraperControlRepository();

export async function startScraperTriggerQueue(): Promise<void> {
  await scraperTriggerQueue.init();

  // 🔁 Consumer 
  await scraperTriggerQueue.consume(async ({ slug }) => {
    console.log(`Trigger received for ${slug}`);

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