import express from "express";
import { buildDealText } from "../utils/dealTextBuilder.js";
import { embeddingService } from "../services/embeddingService.js";
import { UserEventModel } from "../models/userEvent.model.js";
import { rebuildUserProfile } from "../services/userProfile.service.js";

const router = express.Router();

const SAMPLE_DEALS = [
  {
    dealId: "sample-deal-pizza-2p",
    brandId: "sample-brand-dominos",
    brandName: "Dominos",
    brandSlug: "dominos",
    title: "Cheese Burst Duo Deal",
    description: "Two personal pizzas with drink add-on for lunch or dinner.",
    price: 2399,
    discountPercent: 25,
    minPersons: 2,
    maxPersons: 2,
    cuisineTags: ["pizza", "italian", "fast food"],
    mealType: ["lunch", "dinner"],
    isHot: true,
    viewsCount: 72,
    isActive: true,
    isExpired: false,
    endTime: "2026-12-31T23:59:59.000Z",
    locations: ["Karachi", "Lahore"],
  },
  {
    dealId: "sample-deal-burger-combo",
    brandId: "sample-brand-kfc",
    brandName: "KFC",
    brandSlug: "kfc",
    title: "Burger Combo Feast",
    description: "Burger combo with fries and drink for one or two people.",
    price: 1899,
    discountPercent: 18,
    minPersons: 1,
    maxPersons: 2,
    cuisineTags: ["burger", "fast food", "chicken"],
    mealType: ["lunch", "dinner"],
    isHot: false,
    viewsCount: 41,
    isActive: true,
    isExpired: false,
    endTime: "2026-12-31T23:59:59.000Z",
    locations: ["Karachi"],
  },
  {
    dealId: "sample-deal-family-chicken",
    brandId: "sample-brand-kfc",
    brandName: "KFC",
    brandSlug: "kfc",
    title: "Family Chicken Bucket Deal",
    description: "Large fried chicken meal for families with sides and drinks.",
    price: 4599,
    discountPercent: 22,
    minPersons: 4,
    maxPersons: 6,
    cuisineTags: ["fried chicken", "fast food", "family meal"],
    mealType: ["dinner"],
    isHot: true,
    viewsCount: 93,
    isActive: true,
    isExpired: false,
    endTime: "2026-12-31T23:59:59.000Z",
    locations: ["Karachi", "Islamabad"],
  },
];

router.post("/seed-deals", async (_req, res) => {
  try {
    await Promise.all(
      SAMPLE_DEALS.map(async (deal) => {
        const text = buildDealText(
          {
            title: deal.title,
            description: deal.description,
            price: deal.price,
            discountPercent: deal.discountPercent,
            cuisineTags: deal.cuisineTags,
            mealType: deal.mealType,
            minPersons: deal.minPersons,
            maxPersons: deal.maxPersons,
            endTime: deal.endTime,
            locations: deal.locations,
          },
          { name: deal.brandName },
        );

        await embeddingService.embedAndStoreDeal({
          ...deal,
          text,
        });
      }),
    );

    res.json({
      success: true,
      seededDealIds: SAMPLE_DEALS.map((deal) => deal.dealId),
    });
  } catch (error) {
    console.error("Debug seed-deals error:", error);
    res.status(500).json({
      error: "Failed to seed sample deals",
      detail: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.post("/seed-clicks/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const events = [
      {
        userId,
        dealId: "sample-deal-pizza-2p",
        action: "click_view_detail",
        metadata: { source: "debug_button", sessionId: `debug-${userId}` },
        occurredAt: new Date(),
      },
      {
        userId,
        dealId: "sample-deal-family-chicken",
        action: "click_external_link",
        metadata: {
          source: "debug_button",
          sessionId: `debug-${userId}`,
          url: "https://example.com/family-chicken",
        },
        occurredAt: new Date(),
      },
    ];

    await UserEventModel.insertMany(events);

    res.json({
      success: true,
      seededActions: events.map((event) => ({ action: event.action, dealId: event.dealId })),
    });
  } catch (error) {
    console.error("Debug seed-clicks error:", error);
    res.status(500).json({
      error: "Failed to seed sample clicks",
      detail: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.post("/rebuild-profile/:userId", async (req, res) => {
  try {
    const profile = await rebuildUserProfile(req.params.userId);
    res.json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error("Debug rebuild-profile error:", error);
    res.status(500).json({
      error: "Failed to rebuild user profile",
      detail: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
