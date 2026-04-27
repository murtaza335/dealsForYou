import express from "express";
import { DealEmbeddingModel } from "../models/dealEmbedding.model.js";
import { UserMoodProfileModel } from "../models/userMoodProfile.model.js";
import { rebuildUserProfile } from "../services/userProfile.service.js";
import { env } from "../config/env.js";

const router = express.Router();

function scoreStructured(
  doc: {
    price: number;
    minPersons: number;
    maxPersons: number;
    isHot: boolean;
    viewsCount: number;
    updatedAt?: Date;
  },
  userSignals: { views: number; clicks: number; searches: number }
) {
  const popularityScore = Math.min(1, (doc.viewsCount || 0) / 100);
  const hotScore = doc.isHot ? 1 : 0;
  const freshnessScore = doc.updatedAt
    ? Math.max(0, 1 - (Date.now() - new Date(doc.updatedAt).getTime()) / (1000 * 60 * 60 * 24 * 30))
    : 0.5;

  const interactionStrength =
    Math.min(1, (userSignals.views + userSignals.clicks * 2 + userSignals.searches) / 20);

  return 0.4 * popularityScore + 0.2 * hotScore + 0.2 * freshnessScore + 0.2 * interactionStrength;
}

function parseLimit(value: unknown, fallback: number): number {
  const parsed = typeof value === "string" ? Number(value) : Number(value ?? fallback);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(50, Math.max(1, parsed));
}

router.get("/recommendations/current-mood/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const sessionId = typeof req.query.sessionId === "string" ? req.query.sessionId.trim() : "";

    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }

    const limit = parseLimit(req.query.limit, 6);
    const moodProfile = await UserMoodProfileModel.findOne({ userId, sessionId }).lean();
    const sourceDealIds = moodProfile?.sourceDealIds ?? [];

    if (!moodProfile?.moodVector?.length) {
      return res.json({
        recommendedDealIds: [],
        coldStart: true,
        computedAt: new Date().toISOString(),
        reasonCodes: ["NO_CURRENT_MOOD_PROFILE"],
        debug: [],
      });
    }

    const candidates = await DealEmbeddingModel.aggregate([
      {
        $vectorSearch: {
          index: env.VECTOR_INDEX_NAME,
          path: "embedding",
          queryVector: moodProfile.moodVector,
          numCandidates: Math.max(env.RECOMMENDATION_CANDIDATES, limit * 10),
          limit: Math.max(limit * 5, limit + sourceDealIds.length),
          filter: {
            isActive: true,
            isExpired: false,
          },
        },
      },
      {
        $project: {
          dealId: 1,
          semanticScore: { $meta: "vectorSearchScore" },
        },
      },
    ]);

    const sourceDealIdSet = new Set(sourceDealIds);
    const ranked = candidates
      .filter((doc) => !sourceDealIdSet.has(doc.dealId))
      .slice(0, limit)
      .map((doc) => ({
        dealId: doc.dealId,
        semanticScore: doc.semanticScore,
      }));

    return res.json({
      recommendedDealIds: ranked.map((deal) => deal.dealId),
      coldStart: false,
      computedAt: new Date().toISOString(),
      reasonCodes: ["CURRENT_SESSION_MOOD_VECTOR"],
      debug: ranked,
    });
  } catch (err) {
    console.error("Current mood recommendations error:", err);
    return res.status(500).json({ error: "Failed to fetch current mood recommendations" });
  }
});

router.post("/recommendations/refresh/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = Number(req.body?.limit || env.RECOMMENDATION_LIMIT);
    const numCandidates = Number(req.body?.numCandidates || env.RECOMMENDATION_CANDIDATES);

    const profile = await rebuildUserProfile(userId);

    if (profile.coldStart || !profile.profileVector) {
      return res.json({
        recommendedDealIds: [],
        coldStart: true,
        computedAt: new Date().toISOString(),
        reasonCodes: ["NO_INTERACTION_HISTORY"],
      });
    }

    const candidates = await DealEmbeddingModel.aggregate([
      {
        $vectorSearch: {
          index: env.VECTOR_INDEX_NAME,
          path: "embedding",
          queryVector: profile.profileVector,
          numCandidates,
          limit: Math.max(limit * 3, limit),
          filter: {
            isActive: true,
            isExpired: false,
          },
        },
      },
      {
        $project: {
          dealId: 1,
          price: 1,
          minPersons: 1,
          maxPersons: 1,
          isHot: 1,
          viewsCount: 1,
          updatedAt: 1,
          semanticScore: { $meta: "vectorSearchScore" },
        },
      },
    ]);

    const ranked = candidates
      .map((doc) => {
        const structured = scoreStructured(doc, profile.signalsUsed);
        const finalScore = 0.7 * doc.semanticScore + 0.3 * structured;
        return {
          dealId: doc.dealId,
          semanticScore: doc.semanticScore,
          structuredScore: structured,
          finalScore,
        };
      })
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, limit);

    res.json({
      recommendedDealIds: ranked.map((r) => r.dealId),
      coldStart: false,
      computedAt: new Date().toISOString(),
      reasonCodes: ["HYBRID_VECTOR_RERANK"],
      debug: ranked,
    });
  } catch (err) {
    console.error("Recommendations error:", err);
    res.status(500).json({ error: "Failed to fetch recommendations" });
  }
});

export default router;
