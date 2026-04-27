import { Schema, model } from "mongoose";

const userEventSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    dealId: { type: String, default: null, index: true },
    // CHANGED: More specific action types
    action: { 
      type: String, 
      enum: [
        "view_page_load",        // Page loaded (deal appeared in grid)
        "deal_view",             // User scrolled/focused on deal card
        "click_view_detail",     // Clicked "View Details" button
        "click_external_link",   // Clicked link to restaurant site
        "search_query"           // User searched
      ], 
      required: true, 
      index: true 
    },
    queryText: { type: String, default: null }, // For search_query
    metadata: { 
      // Optional: capture additional context
      source: String,           // "recommended" | "top" | "filtered"
      sessionId: String,        // Track session for time decay
      dwellTime: Number,        // Milliseconds user hovered/viewed
      url: String,              // URL clicked (for click_external_link)
    },
    occurredAt: { type: Date, default: Date.now, index: true },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  },
  { timestamps: true, collection: "user_events" }
);

userEventSchema.index({ userId: 1, occurredAt: -1 });
userEventSchema.index({ userId: 1, action: 1, occurredAt: -1 });
userEventSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const UserEventModel = model("UserEvent", userEventSchema);
