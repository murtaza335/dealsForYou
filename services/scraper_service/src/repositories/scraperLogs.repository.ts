import { ScraperLogModel } from "../models/scraperLogs.model.js";

export class ScraperLogRepository {
  async createLog(data: {
    brandId: any;
    sourceSlug: string;
    status: "success" | "failure";
    dealsScraped: number;
  }) {
    return await ScraperLogModel.create({
      ...data
    });
  }

  async getLogs(brandId: string, sourceSlug: string) {
    return await ScraperLogModel.find({ brandId, sourceSlug })
      .sort({ createdAt: -1 });
  }
}