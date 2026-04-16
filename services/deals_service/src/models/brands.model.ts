import mongoose, { Schema, Document, Types } from "mongoose";

// CREATE TABLE brands (
//     brand_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//     name              VARCHAR(100) NOT NULL UNIQUE,
//     slug              VARCHAR(100) UNIQUE,
//     tagline           VARCHAR(255),
//     description       TEXT,
//     logo_url          TEXT,
//     website           TEXT,
//     is_active         BOOLEAN DEFAULT true,
//     popularity_score  FLOAT DEFAULT 0,                 -- updated by background job from views/trends
//     created_at        TIMESTAMPTZ DEFAULT NOW(),
//     updated_at        TIMESTAMPTZ DEFAULT NOW()
// );

// our schema for the brand data that we will be storing in our database
export interface BrandDocument extends Document<Types.ObjectId> {
  brandId: string; // UUID string
  name: string;
  slug: string;
  baseUrl: string;
  isActive: boolean;
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  tagline?: string;
  description?: string;
  logoUrl?: string;
  website?: string;
}

const brandSchema = new Schema<BrandDocument>(
  {
    brandId: {
      type: String,
      required: true,
      unique: true,
      default: () => new mongoose.Types.ObjectId().toString() // Generate UUID string
    },
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    baseUrl: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    publishedAt: { type: Date, default: Date.now },
    tagline: { type: String },
    description: { type: String },
    logoUrl: { type: String },
    website: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const BrandModel = mongoose.model<BrandDocument>("Brand", brandSchema);
