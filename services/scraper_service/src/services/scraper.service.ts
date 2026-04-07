import { DominosScraper } from "../scrapers/dominos.scraper.js";
import { DealRepository } from "../repositories/deal.repository.js";

export class ScraperService {
  private dominos = new DominosScraper();
  private repo = new DealRepository();

  async run() {
    console.log("Running Dominos scraper...");

    const deals = await this.dominos.fetchDeals();

    await this.repo.syncDeals(deals);
    console.log(`Fetched ${deals.length} deals from Dominos`);
    
    console.log("Scraping completed");
  }
}