import { DominosScraper } from "../scrapers/dominos.scraper.js";
import { KfcScraper } from "../scrapers/kfc.scraper.js";
import { BaseScraper } from "../scrapers/base.scraper.js";
import { DealRepository } from "../repositories/deal.repository.js";
import { ScraperControlRepository } from "../repositories/scrapercontrol.js";
import { rabbitMQ } from "../services/rabbitmq.publisher.js";

export class ScraperService {
  private repo = new DealRepository();
  private scraperSourceRepo = new ScraperControlRepository();
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