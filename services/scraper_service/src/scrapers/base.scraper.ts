import { Deal } from "../interfaces/deal.interface.js";
import { ScraperSourceDocument } from "../models/scraper_sources.js";

export abstract class BaseScraper {
  abstract fetchDeals(source: ScraperSourceDocument): Promise<Deal[]>;
}