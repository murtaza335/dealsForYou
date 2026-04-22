import { Schema, model } from "mongoose";

const dealEmbeddingSchema = new Schema(
  {
    dealId: { type: String, required: true, unique: true, index: true },
    brandId: { type: String, required: true, index: true },

    embedding: { type: [Number], required: true },
    embeddingModel: { type: String, required: true },
    embeddingVersion: { type: Number, required: true, default: 1 },
    textHash: { type: String, required: true, index: true },

    isActive: { type: Boolean, default: true, index: true },
    isExpired: { type: Boolean, default: false, index: true },
    price: { type: Number, required: true, index: true },
    discountPercent: { type: Number, default: 0 },
    minPersons: { type: Number, default: 1 },
    maxPersons: { type: Number, default: 1 },
    cuisineTags: { type: [String], default: [] },
    mealType: { type: [String], default: [] },
    isHot: { type: Boolean, default: false },
    viewsCount: { type: Number, default: 0 },
    brandName: { type: String, default: null },
    locations: { type: [String], default: [] },
    endTime: { type: Date, default: null, index: true },
    sourceText: { type: String, required: true },
  },
  { timestamps: true, collection: "deal_embeddings" }
);

dealEmbeddingSchema.index({ isActive: 1, isExpired: 1 });
dealEmbeddingSchema.index({ cuisineTags: 1 });
dealEmbeddingSchema.index({ mealType: 1 });

export const DealEmbeddingModel = model("DealEmbedding", dealEmbeddingSchema);
