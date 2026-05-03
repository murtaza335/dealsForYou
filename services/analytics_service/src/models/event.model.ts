import mongoose, { Schema, Document } from "mongoose";
import { EventType } from "../types/event.types.js";

export interface IEvent extends Document {
  eventType: EventType;
  userId: string;
  dealId?: string;
  queryText?: string;
  brandSlug?: string;
  source?: string;
  sessionId: string;
  dwellTime?: number;
  scoreDelta?: number;
  url?: string;
  processed?: boolean;
  timestamp: Date;
}

const EventSchema = new Schema<IEvent>({
  eventType: { type: String, enum: Object.values(EventType), required: true },

  userId: { type: String},

  dealId: { type: String , required: true},
  queryText: { type: String },

  brandSlug: { type: String , required: true},
  source: { type: String },

  sessionId: { type: String },  

  dwellTime: { type: Number },
  scoreDelta: { type: Number },

  url: { type: String },
  processed: { type: Boolean, default: false, index: true },

  timestamp: { type: Date, default: Date.now },
});

export const EventModel = mongoose.model<IEvent>("Event", EventSchema);