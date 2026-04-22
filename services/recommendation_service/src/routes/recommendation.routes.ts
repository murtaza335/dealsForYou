import express from "express";
import { DealEmbeddingModel } from "../models/dealEmbedding.model.js";
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
