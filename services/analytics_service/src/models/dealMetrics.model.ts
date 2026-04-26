import mongoose, { Schema, Document } from "mongoose";

export interface IDealMetrics extends Document {
  dealId: string;
  brandSlug: string;

  viewCount: number;
  externalClickCount: number;

  ctr: number;

  recentViewCount: number;
  recentClickCount: number;

  decayedScore: number;
  velocityScore: number;

  totalScore: number;

  lastEventAt: Date;
  updatedAt: Date;
}

const DealMetricsSchema = new Schema<IDealMetrics>({
  dealId: { type: String, required: true, unique: true },
  brandSlug: { type: String, required: true },

  viewCount: { type: Number, default: 0 },
  externalClickCount: { type: Number, default: 0 },

  ctr: { type: Number, default: 0 },

  recentViewCount: { type: Number, default: 0 },
  recentClickCount: { type: Number, default: 0 },

  velocityScore: { type: Number, default: 0 },
  decayedScore: { type: Number, default: 0 },

  totalScore: { type: Number, default: 0 },

  lastEventAt: { type: Date },
  updatedAt: { type: Date, default: Date.now },
});

export const DealMetricsModel = mongoose.model<IDealMetrics>(
  "DealMetrics",
  DealMetricsSchema
);