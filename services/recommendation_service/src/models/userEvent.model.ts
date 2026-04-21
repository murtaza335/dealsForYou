import { Schema, model } from "mongoose";

const userEventSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    dealId: { type: String, default: null, index: true },
    action: { type: String, enum: ["view", "click", "search"], required: true, index: true },
    queryText: { type: String, default: null },
    occurredAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true, collection: "user_events" }
);

userEventSchema.index({ userId: 1, occurredAt: -1 });
userEventSchema.index({ userId: 1, action: 1, occurredAt: -1 });

export const UserEventModel = model("UserEvent", userEventSchema);