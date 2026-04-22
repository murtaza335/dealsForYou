import { DealDocument } from "../models/deal.model.js";
import { DealFilters, DealRepository } from "../repositories/deal.repository.js";

class DealsService {
  private readonly dealRepository = new DealRepository();

  async getDeals(filters: DealFilters): Promise<DealDocument[]> {
    return this.dealRepository.getDeals(filters);
  }
}

export const dealsService = new DealsService();