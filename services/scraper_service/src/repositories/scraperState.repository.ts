import { ScraperStateModel } from "../models/scraperState.model.js";
import { ScraperControlRepository } from "./scraperControl.repository.js";
import mongoose,{ Types } from "mongoose";

const controlRepo = new ScraperControlRepository();

export class ScraperStateRepository {
  async upsertState(data: {
    brandId: any;
    sourceSlug: string;
    status: "success" | "failure";
    dealsScraped: number;
  }) {
    return await ScraperStateModel.findOneAndUpdate(
      {
        brandId: data.brandId,
        sourceSlug: data.sourceSlug
      },
      {
        $set: {
          lastRunAt: new Date(),
          lastStatus: data.status,
          noOfDealsScraped: data.dealsScraped,
        }
      },
      {
        upsert: true,
        returnDocument: "after"
      }
    );
  }

  async getState(brandId: string, sourceSlug: string) {
    return await ScraperStateModel.findOne({ brandId, sourceSlug });
  }

   async getLastRunTimeBySlug(sourceSlug: string) {
    const state = await ScraperStateModel.findOne(
      { sourceSlug },
      { lastRunAt: 1, _id: 0 }
    );

    return state?.lastRunAt || null;
  }


}

 // combining all the logic to check if scraper can run in one function for better readability and maintainability of the code in the main scraper service
  // async canRunScraper(sourceSlug: string): Promise<boolean> {
  // // online active brands are in the list so no need to check the sctive again 

  //   // 1. Get last run time
  //   const lastRunAt = await this.getLastRunTimeBySlug(sourceSlug);

  //   // 2. Get scraping interval (minutes -> ms)
  //   const intervalMinutes = await controlRepo.getScrapingIntervalBySlug(sourceSlug);
  //   const intervalMs = (intervalMinutes || 1440) * 60 * 1000; // default to 1440 minutes (24 hours) if not set

  //   const now = new Date().getTime();
  //   const lastRunTime = lastRunAt ? new Date(lastRunAt).getTime() : 0;

  //   const intervalOK =
  //     !lastRunAt || now - lastRunTime >= intervalMs;

  //   // 3. Check time window for current day
  //   const day = new Date().toLocaleDateString("en-US", {
  //     weekday: "long",
  //   });

  //   const periods = await controlRepo.getTimePeriodsByDay(sourceSlug, day);

  //   const currentHHMM = new Date().toTimeString().slice(0, 5);

  //   const timeWindowOK = periods.some((p) => {
  //     return p.open <= currentHHMM && currentHHMM <= p.close;
  //   });
    
  //   // 5. OR logic between interval & time window, AND with active status
  //   return (intervalOK || timeWindowOK);
  // }