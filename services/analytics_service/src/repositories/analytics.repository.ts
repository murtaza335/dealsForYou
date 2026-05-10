import { EventModel } from "../models/event.model.js";
import { EventType } from "../types/event.types.js";

export class AnalyticsRepository {
  static async getOverallExternalLinkCount(): Promise<number> {
    return EventModel.countDocuments({ eventType: EventType.EXTERNAL_LINK });
  }

  static async getExternalLinkCountByBrandSlug(brandSlug: string): Promise<number> {
    return EventModel.countDocuments({
      eventType: EventType.EXTERNAL_LINK,
      brandSlug,
    });
  }

  static async getBrandDealViewStatsBySlug(brandSlug: string): Promise<{
    brandSlug: string;
    totalViewCount: number;
    deals: Array<{ dealId: string; viewCount: number }>;
  }> {
    const grouped = await EventModel.aggregate<{
      _id: string;
      viewCount: number;
    }>([
      {
        $match: {
          eventType: EventType.CLICK_VIEW_DETAIL,
          brandSlug,
          dealId: { $exists: true, $nin: [null, ""] },
        },
      },
      {
        $group: {
          _id: "$dealId",
          viewCount: { $sum: 1 },
        },
      },
      {
        $sort: {
          viewCount: -1,
          _id: 1,
        },
      },
    ]);

    const deals = grouped.map((item) => ({
      dealId: item._id,
      viewCount: item.viewCount,
    }));

    const totalViewCount = deals.reduce((sum, item) => sum + item.viewCount, 0);

    return {
      brandSlug,
      totalViewCount,
      deals,
    };
  }
}