import { ScraperSourceModel } from "../models/scraperSources.js";
import { ScraperSourceDocument } from "../models/scraperSources.js";

export class ScraperControlRepository {

  //  Get all sources
  async listScraperSources(): Promise<ScraperSourceDocument[]> {
    return ScraperSourceModel.find().sort({ createdAt: -1 });
  }

  //  Used by scheduler to get only active sources (optimized)
  async listActiveScraperSources(): Promise<ScraperSourceDocument[]> {
    return ScraperSourceModel.find({ isActive: true }).sort({ slug: 1 });
  }

  // Create (UPDATED: includes runTimes, removed old fields)
  async createScraperSource(data: {
    brandName: string;
    slug: string;
    baseApiUrl: string;
    scrapApiURl: string;
    body: Record<string, unknown>;
    headers: Record<string, unknown>;
    runTimes: string[]; //  new scheduling field
    isActive?: boolean;
  }): Promise<ScraperSourceDocument> {
    return ScraperSourceModel.create(data);
  }

  // ✅  Update (UPDATED: removed old scheduling logic)
  async updateScraperSourceBySlug(
    slug: string,
    data: Partial<{
      brandName: string;
      baseApiUrl: string;
      scrapApiURl: string;
      body: Record<string, unknown>;
      headers: Record<string, unknown>;
      runTimes: string[]; // ✅ new
      isActive: boolean;
    }>
  ): Promise<ScraperSourceDocument | null> {
    return ScraperSourceModel.findOneAndUpdate(
      { slug },
      data,
      {
        returnDocument: 'after',
        runValidators: true
      }
    );
  }

  //  Deactivate
  async deactivateScraperSource(slug: string): Promise<ScraperSourceDocument | null> {
    return ScraperSourceModel.findOneAndUpdate(
      { slug },
      { isActive: false },
      { returnDocument: 'after' }
    );
  }

  // ✅ Activate
  async activateScraperSource(slug: string): Promise<ScraperSourceDocument | null> {
    return ScraperSourceModel.findOneAndUpdate(
      { slug },
      { isActive: true },
      { returnDocument: 'after' }
    );
  }

  // ✅ Get full document (USED BY runSingle)
  async getBySlug(slug: string): Promise<ScraperSourceDocument | null> {
    return ScraperSourceModel.findOne({ slug });
  }

  // ✅ Check active status (lightweight)
  async isScraperSourceActive(slug: string): Promise<boolean> {
    const source = await ScraperSourceModel.findOne(
      { slug },
      { isActive: 1 }
    );

    return source?.isActive ?? false;
  }

  // ✅ Optional: Get only runTimes (scheduler optimization)
  async getRunTimesBySlug(slug: string): Promise<string[]> {
    const source = await ScraperSourceModel.findOne(
      { slug },
      { runTimes: 1, _id: 0 }
    );

    return source?.runTimes || [];
  }
}