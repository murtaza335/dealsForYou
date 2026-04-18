import mongoose from "mongoose";

export interface ScraperLogDocument extends mongoose.Document {     
    brandId: mongoose.Types.ObjectId;
    sourceSlug: string;
    status: "success" | "failure";
    dealsScraped: number;
    message: string;
    createdAt: Date;
    updatedAt: Date;
}

const scraperLogSchema = new mongoose.Schema<ScraperLogDocument>(
    {
        brandId: { type: mongoose.Schema.Types.ObjectId, ref: "ScraperSource", required: true },    
        sourceSlug: { type: String, required: true },
        status: { type: String, enum: ["success", "failure"], required: true },
        dealsScraped: { type: Number, default: 0 },
        message: { type: String, default: "" }
    },
    { timestamps: true }
);  

export const ScraperLogModel = mongoose.model<ScraperLogDocument>("ScraperLog", scraperLogSchema);



