import { Request, Response } from "express";
import { UserEventModel } from "../models/userEvent.model.js";

/**
 * Track when user clicks "View Details" on a deal card.
 * Payload: { userId, dealId }
 */
export async function trackViewDetail(req: Request, res: Response) {
  try {
    const { userId, dealId, source, dwellTime } = req.body;

    if (!userId || !dealId) {
      return res.status(400).json({ error: "Missing userId or dealId" });
    }

    const event = await UserEventModel.create({
      userId,
      dealId,
      action: "click_view_detail",
      metadata: {
        source: source || "unknown", // "recommended", "top", "filtered"
        dwellTime: dwellTime || 0,
      },
      occurredAt: new Date(),
    });

    res.json({ success: true, eventId: String((event as any)._id) });
  } catch (err) {
    console.error("Error tracking view-detail:", err);
    res.status(500).json({ error: "Failed to track event" });
  }
}

/**
 * Track when user clicks external link to restaurant site.
 * Payload: { userId, dealId, url }
 */
export async function trackExternalLink(req: Request, res: Response) {
  try {
    const { userId, dealId, url } = req.body;

    if (!userId || !dealId) {
      return res.status(400).json({ error: "Missing userId or dealId" });
    }

    const event = await UserEventModel.create({
      userId,
      dealId,
      action: "click_external_link",
      metadata: {
        url: url || null,
      },
      occurredAt: new Date(),
    });

    res.json({ success: true, eventId: String((event as any)._id) });
  } catch (err) {
    console.error("Error tracking external-link:", err);
    res.status(500).json({ error: "Failed to track event" });
  }
}