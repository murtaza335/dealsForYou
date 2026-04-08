import { DominosScraper } from "../scrapers/dominos.scraper.js";
import { DealRepository } from "../repositories/deal.repository.js";

export class ScraperService {
  private repo = new DealRepository();
  private dominos = new DominosScraper();

  async run() {
    console.log("Starting scraping process...");

    //  STEP 1: Ensure brand exists
    const brand = await this.repo.createOrGetBrand({
      name: "Dominos",
      slug: "dominos",
      imageBaseUrl: "https://www.dominos.com.pk/images/"
    });

    console.log(`Brand ready: ${brand.name}`);

    // STEP 2: Run scraper
    const deals = await this.dominos.fetchDeals();

    console.log(`Fetched ${deals.length} deals from scraper`);

    // STEP 3: Sync deals (compare + insert + delete)
    await this.repo.syncDealsForBrand(brand._id.toString(), deals);

    console.log("Scraping completed successfully");
  }
}