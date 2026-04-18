import { DominosScraper } from "../scrapers/dominos.scraper.js";
import { KfcScraper } from "../scrapers/kfc.scraper.js";
import { BaseScraper } from "../scrapers/base.scraper.js";
import { DealRepository } from "../repositories/deal.repository.js";
import { ScraperControlRepository } from "../repositories/scraperControl.repository.js";
import { rabbitMQ } from "../services/rabbitmq.publisher.js";
import { ScraperLogRepository } from "../repositories/scraperLogs.repository.js";
import { ScraperStateRepository } from "../repositories/scraperState.repository.js";

export class ScraperService {
  private repo = new DealRepository();
  private scraperSourceRepo = new ScraperControlRepository();
  private logRepo = new ScraperLogRepository();
  private stateRepo = new ScraperStateRepository();
  private publisher = rabbitMQ;

  private scraperRegistry: Record<string, BaseScraper> = {
    dominos: new DominosScraper(),
    kfc: new KfcScraper()
  };

  // this is the main function that will run all the scrapers and sync the data with the database one by one in a sequential manner but we can easily make it parallel in the future if needed by using Promise.all and making sure to handle the database operations properly to
  async run() {
    console.log("Starting all scrapers...");

      //  Connect RabbitMQ ONCE
    await this.publisher.init();

    try {
      const sources = await this.scraperSourceRepo.listActiveScraperSources();

      if (sources.length === 0) {
        console.log("No active scraper sources found. Skipping run.");
        return;
      }

      for (const source of sources) {
        const scraper = this.scraperRegistry[source.slug.toLowerCase()];

        if (!scraper) {
          console.warn(
            `No scraper implementation found for slug: ${source.slug}. Source is configured but will be skipped.`
          );
          continue;
        }

        // GETting BRAND ID
        const brandId = source._id;
        console.log(`Checking if scraper can run for ${source.slug} ...`);
        const canRun = await this.stateRepo.canRunScraper(source.slug);

        console.log(`Can run scraper for ${source.slug}: ${canRun}`);
        // check weather scrapper should run or not 
        if (!canRun) {
          console.log(`Skipping scraper for ${source.slug} due to scraping interval or inactive status.`);
          continue;
        }

        console.log(`Running scraper for ${source.slug}...`);

        //  Ensure brand
        const brand = await this.repo.createOrGetBrand({
          name: source.brandName,
          slug: source.slug,
          baseUrl: source.baseApiUrl
        });

        //  Fetch deals
        const deals = await scraper.fetchDeals(source);
      
        //  Send to RabbitMQ
        const payload = {
          brandInfo:{ 
          brand: brand.name,
          slug: brand.slug,
          url: source.baseApiUrl
          },
          deals: deals,
        };

        await this.publisher.publishMessage(payload);
        console.log(payload);


        // Log the number of deals sent to the queue in sscraper log table and if the brand id and slug already exists then update the last run time and the number of deals sent to the queue for that brand in the scraper log table
        await this.logRepo.createLog({
          brandId: brand._id,
          sourceSlug: source.slug,
          status: "success",
          dealsScraped: deals.length
        });

        await this.stateRepo.upsertState({
          brandId: brand._id,
          sourceSlug: source.slug,
          status: "success",
          dealsScraped: deals.length
        });

        console.log(` Sent ${deals.length} deals to queue`);

  console.log(`Fetched ${deals.length} deals from ${source.slug}`);

        //  Sync (compare + insert + delete)
        await this.repo.syncDealsForBrand(brand._id.toString(), deals);
      }
    } finally {
      // Optional: close connection
      await this.publisher.close();
    }

    console.log("All scraping completed");
  }
}