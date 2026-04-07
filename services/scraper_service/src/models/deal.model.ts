import mongoose, { Schema, Document, Types } from "mongoose";

export interface DealDocument extends Document {
  id: number;
  name: string;
  description: string;
  price: number;
  salePrice: number;
  image: string;
  category: string;
  isActive: boolean;
  brandId: Types.ObjectId;
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const dealSchema = new Schema<DealDocument>(
  {
    id: { type: Number, required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true },
    salePrice: { type: Number, default: 0 },
    image: { type: String, required: true },
    category: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    brandId: { type: Schema.Types.ObjectId, ref: "Brand", required: true },
    publishedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

dealSchema.index({ brandId: 1, id: 1 }, { unique: true });

export const DealModel = mongoose.model<DealDocument>("Deal", dealSchema);