import mongoose, { Schema } from "mongoose";
const brandSchema = new Schema({
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    imageBaseUrl: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
    publishedAt: { type: Date, default: Date.now }
}, { timestamps: true });
export const BrandModel = mongoose.model("Brand", brandSchema);
