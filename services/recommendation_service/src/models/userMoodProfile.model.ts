import { Schema, model, type InferSchemaType } from "mongoose";

const userMoodProfileSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    moodVector: { type: [Number], required: true },
    signalsUsed: {
      views: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      searches: { type: Number, default: 0 },
    },
    sourceDealIds: { type: [String], default: [] },
    lastEventAt: { type: Date, default: Date.now, index: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true, collection: "user_mood_profiles" }
);

userMoodProfileSchema.index({ userId: 1, sessionId: 1 }, { unique: true });
userMoodProfileSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type UserMoodProfileDocument = InferSchemaType<typeof userMoodProfileSchema>;

export const UserMoodProfileModel = model("UserMoodProfile", userMoodProfileSchema);
