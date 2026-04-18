import { ScraperSourceModel } from "../models/scraperSources.js";


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

//get status by slug active or not
async isScraperSourceActive(slug: string) {
    const source = await ScraperSourceModel.findOne(
      { slug },
      { isActive: 1, _id: 0 }
    );
    return source?.isActive || false;
  } 

// get time periods by slug and day
async getTimePeriodsByDay(slug: string, day: string) {
    const source = await ScraperSourceModel.findOne(
      { slug },
      { scrapingTime: 1, _id: 0 }
    );

    if (!source) return [];

    const dayConfig = source.scrapingTime.find(
      (d) => d.day.toLowerCase() === day.toLowerCase()
    );

    if (!dayConfig) return [];

    return dayConfig.timePeriods;
  }

  // get scraping interval by slug
  async getScrapingIntervalBySlug(slug: string) {
    const source = await ScraperSourceModel.findOne(
      { slug},      

      { scrapingInterval: 1, _id: 0 }
    );    
    return source?.scrapingInterval || 24; // default to 24 hours if not set
  }
}