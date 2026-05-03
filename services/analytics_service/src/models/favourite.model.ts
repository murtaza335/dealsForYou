import mongoose, { Schema, Document } from "mongoose";

export interface IFavourite extends Document {
  userId: string;
  dealExternalId: string;
  brandSlug: string;
  createdAt: Date;
  updatedAt: Date;
}

const FavouriteSchema = new Schema<IFavourite>(
  {
    userId: { type: String, required: true, index: true },
    dealExternalId: { type: String, required: true },
    brandSlug: { type: String, required: true },
  },
  { timestamps: true }
);

// Compound index for unique favourite per user per deal
FavouriteSchema.index({ userId: 1, dealExternalId: 1, brandSlug: 1 }, { unique: true });

export const FavouriteModel = mongoose.model<IFavourite>("Favourite", FavouriteSchema);
