import { Schema, model, type InferSchemaType } from "mongoose";

const trackClickSchema = new Schema(
  {
    dealId: {
      type: Number,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      default: null,
      index: true,
    },
    clickedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  },
);

export type TrackClickDocument = InferSchemaType<typeof trackClickSchema>;

export const TrackClickModel = model("TrackClick", trackClickSchema);