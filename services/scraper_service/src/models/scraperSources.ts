import mongoose,{Schema, Document, Types} from "mongoose";

export interface ScraperSourceDocument extends Document {
  brandName: string;
  slug: string;
  baseApiUrl: string;
  scrapApiURl: string;
  body: object;
  headers: object;
  scrapingInterval: number; // in hours after how many hours the scraper should run again
  scrapingTime : { day: string; timePeriods: { open: string; close: string }[] }[]; // on which time the scraper should run + 10 mins if scrapper service run and and scrapped time within 10 mins then it should run means scrapped time on monday 5.01 am and current time is 5.05 am then it should run because it is within 10 mins
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;  
}

const scraperSourceSchema = new Schema<ScraperSourceDocument>(
  {
    brandName: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    baseApiUrl: { type: String, required: true },
    scrapApiURl: { type: String, required: true },
    body: { type: Schema.Types.Mixed, required: true },
    headers: { type: Schema.Types.Mixed, required: true },
    scrapingInterval: { type: Number, default: 24 }, // in hours
    scrapingTime: [
      {
        day: { type: String, required: true },
        timePeriods: [
          {
            open: { type: String, required: true }, 
            close: { type: String, required: true }
            }
        ]
      }
    ],  
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }  
);  

export const ScraperSourceModel = mongoose.model<ScraperSourceDocument>("ScraperSource", scraperSourceSchema);
