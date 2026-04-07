import { Deal } from "../interfaces/deal.interface.js";

export abstract class BaseScraper {
  abstract fetchDeals(): Promise<Deal[]>;
}