import { DominosScraper } from "../scrapers/dominos.scraper.js";
import { KfcScraper } from "../scrapers/kfc.scraper.js";
import { DealRepository } from "../repositories/deal.repository.js";

export class ScraperService {
  private repo = new DealRepository();

  // we can easily add more scrapers here in the future by just adding them to this array with their brand info and scraper instance
  private scrapers = [
    {
      scraper: new DominosScraper(),
      brand: {
        name: "Dominos",
        slug: "dominos",
        imageBaseUrl: "https://www.dominos.com.pk/images/"
      }
    },
    {
      scraper: new KfcScraper(),
      brand: {
        name: "KFC",
        slug: "kfc",
        imageBaseUrl: "https://www.kfcpakistan.com/images/"
      }
    }
  ];

  // this is the main function that will run all the scrapers and sync the data with the database one by one in a sequential manner but we can easily make it parallel in the future if needed by using Promise.all and making sure to handle the database operations properly to
  async run() {
    console.log("Starting all scrapers...");

    for (const s of this.scrapers) {

      console.log(`Running scraper for ${s.brand.slug}...`);

      // ✅ Ensure brand
      const brand = await this.repo.createOrGetBrand(s.brand);

      // ✅ Fetch deals
      const deals = await s.scraper.fetchDeals();

      console.log(`Fetched ${deals.length} deals from ${s.brand.slug}`);

      // ✅ Sync (compare + insert + delete)
      await this.repo.syncDealsForBrand(brand._id.toString(), deals);
    }

    console.log("All scraping completed");
  }
}