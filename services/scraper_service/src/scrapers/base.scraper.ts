import { Deal } from "../interfaces/deal.interface.js";
import { ScraperSourceDocument } from "../models/scraperSources.js";

export abstract class BaseScraper {
  abstract fetchDeals(source: ScraperSourceDocument): Promise<Deal[]>;
}