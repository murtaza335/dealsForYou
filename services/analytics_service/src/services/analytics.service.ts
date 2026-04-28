import { EventModel } from "../models/event.model.js";
import { DealMetricsModel } from "../models/dealMetrics.model.js";
import { EventType } from "../types/event.types.js";
import { getDecayFactor } from "../utils/decay.js";
import { publishRecommendationEvent } from "../utils/recommendationPublisher.js";

function toRecommendationAction(
  eventType: EventType
): "deal_view" | "click_view_detail" | "click_external_link" | "search_query" | null {
  switch (eventType) {
    case EventType.DEAL_VIEW:
      return "deal_view";
    case EventType.CLICK_VIEW_DETAIL:
      return "click_view_detail";
    case EventType.EXTERNAL_LINK:
      return "click_external_link";
    case EventType.SEARCH_QUERY:
      return "search_query";
    default:
      return null;
  }
}

export class AnalyticsService {
  private static readonly TRENDING_LIMIT = 5;

  static async trackEvent(data: any) {
    let scoreDelta = 0;

    switch (data.eventType) {
      case EventType.DEAL_VIEW:
        scoreDelta = 1;
        break;
      case EventType.CLICK_VIEW_DETAIL:
        scoreDelta = 1.5;
        break;
      case EventType.EXTERNAL_LINK:
        scoreDelta = 2;
        break;
      default:
        scoreDelta = 0;
        break;
    }

    data.scoreDelta = scoreDelta;

    const event = await EventModel.create(data);

    // remove it because it will call on each event which is not good
    // if (data.dealId) {
    //   await this.updateDealMetrics(data);
    // }

    const action = toRecommendationAction(data.eventType);
    if (action) {
      console.log(`Publishing recommendation event for action: ${action}, userId: ${data.userId}, dealId: ${data.dealId}`);
      try {
        await publishRecommendationEvent({
          action,
          userId: String(data.userId),
          dealId: data.dealId ? String(data.dealId) : null,
          queryText: data.queryText ?? null,
          source: data.source ?? null,
          sessionId: String(data.sessionId),
          dwellTime: data.dwellTime ?? null,
          url: data.url ?? null,
          occurredAt: event.timestamp.toISOString(),
        });
      } catch (error) {
        console.error("Failed to publish analytics event:", error);
      }
    }

    return event;
  }

  static async updateDealMetrics(data: any) {
    const existing = await DealMetricsModel.findOne({ dealId: data.dealId });

    const now = new Date();
    const eventScore = data.scoreDelta || 0;

    let decayedScore = eventScore;

    if (existing) {
      const decayFactor = getDecayFactor(existing.lastEventAt);

      decayedScore = existing.decayedScore * decayFactor + eventScore;
    }

    const update: any = {
      $inc: {
        totalScore: eventScore,
      },
      $set: {
        brandSlug: data.brandSlug,
        lastEventAt: now,
        updatedAt: now,
        decayedScore,
      },
    };

    if (data.eventType === EventType.DEAL_VIEW) {
      update.$inc.viewCount = 1;
    }

    if (data.eventType === EventType.EXTERNAL_LINK) {
      update.$inc.externalClickCount = 1;
    }

    const metrics = await DealMetricsModel.findOneAndUpdate(
      { dealId: data.dealId },
      update,
      { upsert: true, returnDocument: 'after' }
    );

    // recompute CTR
    if (metrics.viewCount > 0) {
      metrics.ctr = metrics.externalClickCount / metrics.viewCount;
    }

    await metrics.save();
  }

  static async getTrendingDeals() {
    const safeLimit = this.TRENDING_LIMIT;

    const candidates = await DealMetricsModel.find({})
      .select("dealId brandSlug viewCount externalClickCount ctr totalScore decayedScore lastEventAt updatedAt")
      .sort({ decayedScore: -1, lastEventAt: -1 })
      .limit(Math.max(safeLimit * 5, 50))
      .lean();

    const deals = candidates
      .map((deal) => {
        const currentTrendScore = deal.lastEventAt
          ? deal.decayedScore * getDecayFactor(new Date(deal.lastEventAt))
          : 0;

        return {
          dealId: deal.dealId,
          brandSlug: deal.brandSlug,
          viewCount: deal.viewCount,
          externalClickCount: deal.externalClickCount,
          ctr: deal.ctr,
          totalScore: deal.totalScore,
          currentTrendScore,
          lastEventAt: deal.lastEventAt,
          updatedAt: deal.updatedAt,
        };
      })
      .sort((a, b) => {
        if (b.currentTrendScore !== a.currentTrendScore) {
          return b.currentTrendScore - a.currentTrendScore;
        }

        if (b.ctr !== a.ctr) {
          return b.ctr - a.ctr;
        }

        return b.externalClickCount - a.externalClickCount;
      })
      .slice(0, safeLimit);

    return deals;
  }

  static async getTrendingBrands() {
    const safeLimit = this.TRENDING_LIMIT;

    const metrics = await DealMetricsModel.find({})
      .select("brandSlug dealId viewCount externalClickCount ctr totalScore decayedScore lastEventAt")
      .lean();

    const brandMap = new Map<
      string,
      {
        brandSlug: string;
        dealCount: number;
        viewCount: number;
        externalClickCount: number;
        totalScore: number;
        trendScore: number;
      }
    >();

    for (const item of metrics) {
      const brandSlug = item.brandSlug;
      if (!brandSlug) continue;

      const currentTrendScore = item.lastEventAt
        ? item.decayedScore * getDecayFactor(new Date(item.lastEventAt))
        : 0;

      const existing = brandMap.get(brandSlug) ?? {
        brandSlug,
        dealCount: 0,
        viewCount: 0,
        externalClickCount: 0,
        totalScore: 0,
        trendScore: 0,
      };

      existing.dealCount += 1;
      existing.viewCount += item.viewCount || 0;
      existing.externalClickCount += item.externalClickCount || 0;
      existing.totalScore += item.totalScore || 0;
      existing.trendScore += currentTrendScore;

      brandMap.set(brandSlug, existing);
    }

    const brands = [...brandMap.values()]
      .map((brand) => ({
        ...brand,
        ctr: brand.viewCount > 0 ? brand.externalClickCount / brand.viewCount : 0,
      }))
      .sort((a, b) => {
        if (b.trendScore !== a.trendScore) {
          return b.trendScore - a.trendScore;
        }

        if (b.ctr !== a.ctr) {
          return b.ctr - a.ctr;
        }

        return b.externalClickCount - a.externalClickCount;
      })
      .slice(0, safeLimit);

    return brands;
  }
}
