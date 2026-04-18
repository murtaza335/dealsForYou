import mongoose from "mongoose";

//to keep the record of scraper when last run for the particular brand 
export interface ScraperStateDocument extends mongoose.Document {
  brandId: mongoose.Types.ObjectId;
  sourceSlug: string;
  lastRunAt: Date; // explicit timestamp for last run because updated also changes when some other change also occur 
  lastStatus: "success" | "failure";
  noOfDealsScraped: number;
  createdAt: Date;
  updatedAt: Date;
}

const scraperStateSchema = new mongoose.Schema<ScraperStateDocument>(
  {
    brandId: { type: mongoose.Schema.Types.ObjectId, ref: "ScraperSource", required: true },
    sourceSlug: { type: String, required: true },
    lastRunAt: { type: Date, required: true },
    lastStatus: { type: String, enum: ["success", "failure"], required: true },
    noOfDealsScraped: { type: Number, default: 0 },
  },
  { timestamps: true }
);

scraperStateSchema.index({ brandId: 1, sourceSlug: 1 }, { unique: true });

export const ScraperStateModel = mongoose.model<ScraperStateDocument>(
  "ScraperState",
  scraperStateSchema
);