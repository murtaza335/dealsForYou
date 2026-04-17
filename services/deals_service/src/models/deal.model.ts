import mongoose, { Schema, Document, Types } from "mongoose";

// CREATE TABLE deals (
//     deal_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//     brand_id          UUID NOT NULL REFERENCES brands(brand_id) ON DELETE CASCADE,
//     external_id       VARCHAR(100),                     -- unique per brand (from scraper)
//     title             VARCHAR(200) NOT NULL,
//     description       TEXT,
//     price             NUMERIC(10,2) NOT NULL,           -- discounted price
//     original_price    NUMERIC(10,2),
//     currency          VARCHAR(3) DEFAULT 'PKR',
//     discount_percent  NUMERIC(5,2),
//     min_persons       SMALLINT,
//     max_persons       SMALLINT,
//     cuisine_tags      TEXT[],                          -- e.g. {pizza, burger, chinese}
//     meal_type         TEXT[],                          -- {breakfast, lunch, dinner, snack}
//     conditions        TEXT,                            -- "valid for 2 persons", "delivery only"
//     start_time        TIMESTAMPTZ,
//     end_time          TIMESTAMPTZ NOT NULL,
//     is_hot            BOOLEAN DEFAULT false,            -- computed by background job
//     views_count       INT DEFAULT 0,
//     scraped_at        TIMESTAMPTZ,
//     created_at        TIMESTAMPTZ DEFAULT NOW(),
//     updated_at        TIMESTAMPTZ DEFAULT NOW(),
//     UNIQUE(brand_id, external_id)
// );

//our schema for the deal data that we will be storing in our database
export interface DealDocument extends Document {
  dealId: string; // UUID string
  brandId: Types.ObjectId; // Reference to Brand
  externalId: string; // Unique ID from scraper per brand
  title: string;
  description?: string;
  price: number;
  originalPrice?: number;
  currency: string;
  discountPercent?: number;
  minPersons?: number;
  maxPersons?: number;
  cuisineTags?: string[];
  mealType?: string[];
  conditions?: string;
  startTime?: Date;
  endTime: Date;
  isExpired: boolean;
  isActive: boolean;
  isHot: boolean;
  viewsCount: number;
  scrapedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const dealSchema = new Schema<DealDocument>(
  {
    dealId: {
      type: String,
      required: true,
      unique: true,
      default: () => new mongoose.Types.ObjectId().toString() // Generate UUID string
    },
    brandId: { type: Schema.Types.ObjectId, ref: "Brand", required: true },
    externalId: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    currency: { type: String, default: "PKR" },
    discountPercent: { type: Number },
    minPersons: { type: Number },
    maxPersons: { type: Number },
    cuisineTags: [{ type: String }],
    mealType: [{ type: String }],
    conditions: { type: String },
    startTime: { type: Date },
    endTime: { type: Date, required: true },
    isExpired: {
      type: Boolean,
      default: function(): boolean {
        return this.endTime < new Date();
      }
    },
    isActive: {
      type: Boolean,
      default: function(): boolean {
        return this.endTime > new Date();
      }
    },
    isHot: { type: Boolean, default: false },
    viewsCount: { type: Number, default: 0 },
    scrapedAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

dealSchema.index({ brandId: 1, externalId: 1 }, { unique: true });

export const DealModel = mongoose.model<DealDocument>("Deal", dealSchema);