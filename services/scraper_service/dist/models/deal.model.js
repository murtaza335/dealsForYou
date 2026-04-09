import mongoose, { Schema } from "mongoose";
const dealSchema = new Schema({
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
}, { timestamps: true });
dealSchema.index({ brandId: 1, id: 1 }, { unique: true });
export const DealModel = mongoose.model("Deal", dealSchema);
