import { ScraperSourceModel } from "../models/scraper_sources.js";


export class ScraperControlRepository {

  async listScraperSources() {
    return ScraperSourceModel.find().sort({ createdAt: -1 });
  }

  async listActiveScraperSources() {
    return ScraperSourceModel.find({ isActive: true }).sort({ slug: 1 });
  }

  async createScraperSource(data: {
    brandName: string;
    slug: string;
    baseApiUrl: string;
    scrapApiURl: string;
    body: Record<string, unknown>;
    headers: Record<string, unknown>;
    scrapingInterval?: number;
    scrapingTime?: { day: string; timePeriods: { open: string; close: string }[] }[];
    isActive?: boolean;
  }) {
    return ScraperSourceModel.create(data);
  }

  async updateScraperSourceBySlug(
    slug: string,
    data: Partial<{
      brandName: string;
      baseApiUrl: string;
      scrapApiURl: string;
      body: Record<string, unknown>;
      headers: Record<string, unknown>;
      scrapingInterval: number;
      scrapingTime: { day: string; timePeriods: { open: string; close: string }[] }[];
      isActive: boolean;
    }>
  ) {
    return ScraperSourceModel.findOneAndUpdate({ slug }, data, {
      new: true,
      runValidators: true
    });
  }

// Deactivate a scraper source by id
async deactivateScraperSource(slug: string) {
return ScraperSourceModel.findOneAndUpdate({ slug }, {
  isActive: false
}, { new: true });
}

// Activate a scraper source by slug
async activateScraperSource(slug: string) {
  return ScraperSourceModel.findOneAndUpdate({ slug }, {
    isActive: true
  }, { new: true });
}

// get id by slug
async getScraperSourceBySlug(slug: string) {
    return ScraperSourceModel.findOne({ slug });
}
}