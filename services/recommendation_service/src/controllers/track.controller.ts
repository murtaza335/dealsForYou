import { Request, Response } from "express";
import { UserEventModel } from "../models/userEvent.model.js";

export async function trackViewDetail(req: Request, res: Response) {
  try {
    const { userId, dealId, source, dwellTime, sessionId } = req.body;

    if (!userId || !dealId) {
      return res.status(400).json({ error: "Missing userId or dealId" });
    }

    const event = await UserEventModel.create({
      userId,
      dealId: String(dealId),
      action: "click_view_detail",
      metadata: {
        source: source || "unknown",
        dwellTime: dwellTime || 0,
        sessionId: sessionId || null,
      },
      occurredAt: new Date(),
    });

    res.json({ success: true, eventId: String(event._id) });
  } catch (err) {
    console.error("Error tracking view-detail:", err);
    res.status(500).json({ error: "Failed to track event" });
  }
}

export async function trackExternalLink(req: Request, res: Response) {
  try {
    const { userId, dealId, url, source, sessionId } = req.body;

    if (!userId || !dealId) {
      return res.status(400).json({ error: "Missing userId or dealId" });
    }

    const event = await UserEventModel.create({
      userId,
      dealId: String(dealId),
      action: "click_external_link",
      metadata: {
        url: url || null,
        source: source || "unknown",
        sessionId: sessionId || null,
      },
      occurredAt: new Date(),
    });

    res.json({ success: true, eventId: String(event._id) });
  } catch (err) {
    console.error("Error tracking external-link:", err);
    res.status(500).json({ error: "Failed to track event" });
  }
}

export async function trackDealView(req: Request, res: Response) {
  try {
    const { userId, dealId, source, dwellTime, sessionId } = req.body;

    if (!userId || !dealId) {
      return res.status(400).json({ error: "Missing userId or dealId" });
    }

    const event = await UserEventModel.create({
      userId,
      dealId: String(dealId),
      action: "deal_view",
      metadata: {
        source: source || "unknown",
        dwellTime: dwellTime || 0,
        sessionId: sessionId || null,
      },
      occurredAt: new Date(),
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Error tracking deal-view:", err);
    res.status(500).json({ error: "Failed to track event" });
  }
}

export async function trackSearchQuery(req: Request, res: Response) {
  try {
    const { userId, queryText, source, sessionId } = req.body;

    if (!userId || !queryText) {
      return res.status(400).json({ error: "Missing userId or queryText" });
    }

    const event = await UserEventModel.create({
      userId,
      dealId: null,
      action: "search_query",
      queryText: String(queryText),
      metadata: {
        source: source || "search_box",
        sessionId: sessionId || null,
      },
      occurredAt: new Date(),
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Error tracking search-query:", err);
    res.status(500).json({ error: "Failed to track event" });
  }
}
