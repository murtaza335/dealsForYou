import { DealDocument } from "../models/deal.model.js";
import {
  DealFilterOptions,
  DealFilters,
  DealRepository,
  DealsListResult,
} from "../repositories/deal.repository.js";

class DealsService {
  private readonly dealRepository = new DealRepository();

  async getDeals(filters: DealFilters): Promise<DealsListResult> {
    return this.dealRepository.getDeals(filters);
  }

  async getDealById(dealId: string): Promise<DealDocument | null> {
    return this.dealRepository.getDealById(dealId);
  }

  async getDealsByIds(deals: string[] | Array<{ dealId: string; brandSlug?: string }>): Promise<DealDocument[]> {
    return this.dealRepository.getDealsByIds(deals);
  }

  async getFilterOptions(): Promise<DealFilterOptions> {
    console.log("in service")
    return this.dealRepository.getFilterOptions();
  }

  async getFilterBrands(): Promise<Array<{ name: string; slug: string }>> {
    return this.dealRepository.getFilterBrands();
  }

  async getFilterCuisineTags(): Promise<string[]> {
    return this.dealRepository.getFilterCuisineTags();
  }

  async getFilterMealTypes(): Promise<string[]> {
    return this.dealRepository.getFilterMealTypes();
  }

  async getFilterPriceRange(): Promise<{ min: number; max: number }> {
    return this.dealRepository.getFilterPriceRange();
  }
}

export const dealsService = new DealsService();
