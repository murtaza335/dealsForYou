import mongoose, { Schema, Document, Types } from "mongoose";

// our schema for the brand data that we will be storing in our database
export interface BrandDocument extends Document<Types.ObjectId> {
  name: string;
  slug: string;
  baseUrl: string;
  isActive: boolean;
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const brandSchema = new Schema<BrandDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    baseUrl: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
    publishedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const BrandModel = mongoose.model<BrandDocument>("Brand", brandSchema);
