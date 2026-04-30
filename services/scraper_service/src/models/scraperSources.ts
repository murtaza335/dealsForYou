import mongoose,{Schema, Document, Types} from "mongoose";

export interface ScraperSourceDocument extends Document {
  brandName: string;
  slug: string;
  baseApiUrl: string;
  scrapApiURl: string;
  body: object;
  headers: object;
  queryParams?: object;
  //scrapingInterval: number; // in hours after how many hours the scraper should run again
  runTimes: string[]; // simple array of start time only  it must be in HH:MM format colon must be used
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
    queryParams: { type: Schema.Types.Mixed, default: {} },
    //scrapingInterval: { type: Number, default: 24 }, // in hours
    runTimes: { type: [String], default: [] }, // array of start time only 
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }  
);  

export const ScraperSourceModel = mongoose.model<ScraperSourceDocument>("ScraperSource", scraperSourceSchema);
