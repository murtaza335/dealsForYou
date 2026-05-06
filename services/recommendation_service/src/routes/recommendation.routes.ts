import express from "express";
import { DealEmbeddingModel } from "../models/dealEmbedding.model.js";
import { UserMoodProfileModel } from "../models/userMoodProfile.model.js";
import { rebuildUserProfile } from "../services/userProfile.service.js";
import { env } from "../config/env.js";
import { logger, type LogContext } from "../utils/logger.js";

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
  const logContext = (req as any).logContext as LogContext;
  try {
    const { userId } = req.params;
    const sessionId = typeof req.query.sessionId === "string" ? req.query.sessionId.trim() : "";

    logger.logProcessing(`Fetching current mood recommendations for userId: ${userId}, sessionId: ${sessionId}`, logContext);

    if (!sessionId) {
      logger.warn(`Missing sessionId parameter for userId: ${userId}`, logContext);
      return res.status(400).json({ error: "sessionId is required" });
    }

    const limit = parseLimit(req.query.limit, env.RECOMMENDATION_LIMIT);
    logger.logProcessing(`Parsed limit: ${limit}`, logContext);
    
    const moodProfile = await UserMoodProfileModel.findOne({ userId, sessionId }).lean();
    const sourceDealIds = moodProfile?.sourceDealIds ?? [];

    if (!moodProfile?.moodVector?.length) {
      logger.logProcessing(`No mood profile found for userId: ${userId}. Cold start response.`, logContext);
      return res.json({
        recommendedDealIds: [],
        coldStart: true,
        computedAt: new Date().toISOString(),
        reasonCodes: ["NO_CURRENT_MOOD_PROFILE"],
        debug: [],
      });
    }

    logger.logProcessing(`Starting vector search with ${limit} recommendations`, logContext);
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

    logger.logProcessing(`Vector search returned ${candidates.length} candidates`, logContext);
    
    const sourceDealIdSet = new Set(sourceDealIds);
    const ranked = candidates
      .filter((doc) => !sourceDealIdSet.has(doc.dealId))
      .slice(0, limit)
      .map((doc) => ({
        dealId: doc.dealId,
        semanticScore: doc.semanticScore,
      }));

    logger.logProcessing(`Ranked and filtered to ${ranked.length} final recommendations`, logContext);
    
    return res.json({
      recommendedDealIds: ranked.map((deal) => deal.dealId),
      coldStart: false,
      computedAt: new Date().toISOString(),
      reasonCodes: ["CURRENT_SESSION_MOOD_VECTOR"],
      debug: ranked,
    });
  } catch (err) {
    logger.error("Failed to fetch current mood recommendations", err, logContext);
    return res.status(500).json({ error: "Failed to fetch current mood recommendations" });
  }
});

router.post("/recommendations/refresh/:userId", async (req, res) => {
  const logContext = (req as any).logContext as LogContext;
  try {
    const { userId } = req.params;
    logger.logProcessing(`Rebuilding user profile and generating recommendations for userId: ${userId}`, logContext);
    
    const limit = parseLimit(req.body?.limit, env.RECOMMENDATION_LIMIT);
    const numCandidates = Number(req.body?.numCandidates || env.RECOMMENDATION_CANDIDATES);
    logger.logProcessing(`Parameters - limit: ${limit}, numCandidates: ${numCandidates}`, logContext);

    logger.logProcessing(`Fetching and rebuilding user profile`, logContext);
    const profile = await rebuildUserProfile(userId);

    if (profile.coldStart || !profile.profileVector) {
      logger.logProcessing(`Cold start condition detected for userId: ${userId}. No interaction history.`, logContext);
      return res.json({
        recommendedDealIds: [],
        coldStart: true,
        computedAt: new Date().toISOString(),
        reasonCodes: ["NO_INTERACTION_HISTORY"],
      });
    }

    logger.logProcessing(`Starting hybrid vector search`, logContext);
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

    logger.logProcessing(`Vector search returned ${candidates.length} candidates`, logContext);
    
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

    logger.logProcessing(`Ranked and scored ${ranked.length} final recommendations using hybrid scoring`, logContext);
    
    res.json({
      recommendedDealIds: ranked.map((r) => r.dealId),
      coldStart: false,
      computedAt: new Date().toISOString(),
      reasonCodes: ["HYBRID_VECTOR_RERANK"],
      debug: ranked,
    });
  } catch (err) {
    logger.error("Failed to fetch refreshed recommendations", err, logContext);
    res.status(500).json({ error: "Failed to fetch recommendations" });
  }
});

export default router;
