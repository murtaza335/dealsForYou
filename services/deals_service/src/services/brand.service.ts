import { BrandDocument } from "../models/brands.model.js";
import { brandRepository } from "../repositories/brand.repository.js";

class BrandService {
  async upsertBrand(data: {
    name: string;
    slug: string;
    baseUrl: string;
    logoUrl?: string;
    tagline?: string;
    description?: string;
  }): Promise<BrandDocument> {
    return brandRepository.upsertBrand(data);
  }

  async getFilterBrands(): Promise<Array<{ name: string; slug: string }>> {
    return brandRepository.getActiveBrands();
  }

  async getBrandsByNamesOrSlugs(values: string[]) {
    return brandRepository.getBrandsByNamesOrSlugs(values);
  }
}

export const brandService = new BrandService();