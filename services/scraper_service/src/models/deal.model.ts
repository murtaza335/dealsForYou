import mongoose, { Schema, Document, Types } from "mongoose";

//our schema for the deal data that we will be storing in our database
export interface DealDocument extends Document {
  externalId: number;
  title: string;
  description: string;
  price: number;
  salePrice: number;
  imgUrl: string;
  category: string;
  isActive: boolean;
  brandId: Types.ObjectId;
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const dealSchema = new Schema<DealDocument>(
  {
    externalId: { type: Number, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true },
    salePrice: { type: Number, default: 0 },
    imgUrl: { type: String, required: true },
    category: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    brandId: { type: Schema.Types.ObjectId, ref: "Brand", required: true },
    publishedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

dealSchema.index({ brandId: 1, externalId: 1 }, { unique: true });

export const DealModel = mongoose.model<DealDocument>("Deal", dealSchema);