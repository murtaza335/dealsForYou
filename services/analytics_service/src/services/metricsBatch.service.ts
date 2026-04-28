import { EventModel } from "../models/event.model.js";
import { DealMetricsModel } from "../models/dealMetrics.model.js";
import { EventType } from "../types/event.types.js";
import { getDecayFactor } from "../utils/decay.js";

export class MetricsBatchService {
  static async processBatch() {
    const events = await EventModel.find({ processed: false }).lean();

    if (!events.length) {
      console.log("No events to process");
      return;
    }

    console.log(`Processing ${events.length} events`);

    const dealMap = new Map();

    for (const event of events) {
      if (!event.dealId) continue;

      const key = String(event.dealId);

      if (!dealMap.has(key)) {
        dealMap.set(key, {
          dealId: event.dealId,
          brandSlug: event.brandSlug,
          viewCount: 0,
          externalClickCount: 0,
          totalScore: 0,
          lastEventAt: event.timestamp,
        });
      }

      const agg = dealMap.get(key);

      let scoreDelta = 0;

      if (event.eventType === EventType.CLICK_VIEW_DETAIL) {
        agg.viewCount += 1;
        scoreDelta = 1;
      }

      if (event.eventType === EventType.EXTERNAL_LINK) {
        agg.externalClickCount += 1;
        scoreDelta = 2;
      }

      agg.totalScore += scoreDelta;

      if (event.timestamp > agg.lastEventAt) {
        agg.lastEventAt = event.timestamp;
      }
    }

    for (const deal of dealMap.values()) {
      const existing = await DealMetricsModel.findOne({ dealId: deal.dealId });

      let decayedScore = deal.totalScore;

      if (existing) {
        const decayFactor = getDecayFactor(existing.lastEventAt);
        decayedScore =
          existing.decayedScore * decayFactor + deal.totalScore;
      }

      const update: any = {
        $inc: {
          viewCount: deal.viewCount,
          externalClickCount: deal.externalClickCount,
          totalScore: deal.totalScore,
        },
        $set: {
          brandSlug: deal.brandSlug,
          lastEventAt: deal.lastEventAt,
          updatedAt: new Date(),
          decayedScore,
        },
      };

      const metrics = await DealMetricsModel.findOneAndUpdate(
        { dealId: deal.dealId },
        update,
        { upsert: true, returnDocument: "after" }
      );

      // recompute CTR
      if (metrics.viewCount > 0) {
        metrics.ctr =
          metrics.externalClickCount / metrics.viewCount;
        await metrics.save();
      }
    }

    // ✅ mark events as processed
    await EventModel.updateMany(
      { _id: { $in: events.map((e) => e._id) } },
      { $set: { processed: true } }
    );

    console.log("Batch processing complete");
  }
}
