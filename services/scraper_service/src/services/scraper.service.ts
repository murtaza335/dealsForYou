import { DominosScraper } from "../scrapers/dominos.scraper.js";
import { KfcScraper } from "../scrapers/kfc.scraper.js";
import { BaseScraper } from "../scrapers/base.scraper.js";
import { DealRepository } from "../repositories/deal.repository.js";
import { ScraperControlRepository } from "../repositories/scraperControl.repository.js";
import { rabbitMQ } from "../services/rabbitmq.publisher.js";
import { ScraperLogRepository } from "../repositories/scraperLogs.repository.js";
import { ScraperStateRepository } from "../repositories/scraperState.repository.js";
import { WrapLabScraper } from "../scrapers/wraplab.scraper.js";

export class ScraperService {

  // Initialize repositories, scrapers, and message publisher
  private repo = new DealRepository();
  private scraperSourceRepo = new ScraperControlRepository();
  private logRepo = new ScraperLogRepository();
  private stateRepo = new ScraperStateRepository();
  private publisher = rabbitMQ;
  private scraperRegistry: Record<string, BaseScraper> = {

    dominos: new DominosScraper(),
    kfc: new KfcScraper(),
    wraplab: new WrapLabScraper()

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
        console.log(`Processing source: ${source.slug} for brand: ${source.brandName}`);
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

        // Publish message to RabbitMQ and log the payload to the console for debugging purposes
        console.log("Publishing", payload);

        await this.publisher.publishMessage(payload);

        // Log the number of deals sent to the queue in the scraper log table and if the brand id and slug already exists then update the last run time and the number of deals sent to the queue for that brand in the scraper log table
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

    } 
    
    finally {
      // Optional: closing the connection of rabbitMq 
      await this.publisher.close();
    }

    console.log("All scraping completed");

  }

  
  async runSingle(slug: string): Promise<void> {
  const source = await this.scraperSourceRepo.getBySlug(slug);

  if (!source || !source.isActive) return;

  const scraper = this.scraperRegistry[slug.toLowerCase()];
  if (!scraper) return;

  console.log(`Running scraper for ${slug}`);

  const brand = await this.repo.createOrGetBrand({
    name: source.brandName,
    slug: source.slug,
    baseUrl: source.baseApiUrl
  });

  const deals = await scraper.fetchDeals(source);

  await this.publisher.publishMessage({
    brandInfo: {
      brand: brand.name,
      slug: brand.slug,
      url: source.baseApiUrl
    },
    deals
  });

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

  await this.repo.syncDealsForBrand(brand._id.toString(), deals);
}

}