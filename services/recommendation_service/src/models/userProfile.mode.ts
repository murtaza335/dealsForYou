import { Schema, model } from "mongoose";

const userProfileSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    profileVector: { type: [Number], required: true },
    vectorModel: { type: String, required: true },
    vectorVersion: { type: Number, default: 1 },
    signalsUsed: {
      views: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      searches: { type: Number, default: 0 },
    },
    confidenceScore: { type: Number, default: 0 },
    computedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: "user_profiles" }
);

export const UserProfileModel = model("UserProfile", userProfileSchema);