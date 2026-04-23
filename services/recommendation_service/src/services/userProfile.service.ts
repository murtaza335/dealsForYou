import { UserEventModel } from "../models/userEvent.model.js";
import { DealEmbeddingModel } from "../models/dealEmbedding.model.js";
import { UserProfileModel } from "../models/userProfile.mode.js";
import { embeddingService } from "./embeddingService.js";
import { env } from "../config/env.js";

function decayWeight(occurredAt: Date): number {
  const ageDays = (Date.now() - occurredAt.getTime()) / (1000 * 60 * 60 * 24);
  return Math.exp(-ageDays / 30);
}

function actionWeight(action: string): number {
  if (action === "click_view_detail" || action === "click_external_link") return 0.55;
  if (action === "deal_view") return 0.3;
  if (action === "search_query") return 0.15;
  return 0.05;
}

function normalize(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (!magnitude) return vector;
  return vector.map((value) => value / magnitude);
}

export async function rebuildUserProfile(userId: string) {
  const events = await UserEventModel.find({ userId }).sort({ occurredAt: -1 }).limit(100);

  if (!events.length) {
    return {
      coldStart: true,
      profileVector: null,
      signalsUsed: { views: 0, clicks: 0, searches: 0 },
      confidenceScore: 0,
    };
  }

  const dealIds = [...new Set(events.map((event) => event.dealId).filter(Boolean) as string[])];
  const dealEmbeddings = await DealEmbeddingModel.find({ dealId: { $in: dealIds } });
  const embeddingMap = new Map(dealEmbeddings.map((doc) => [doc.dealId, doc.embedding]));

  const searchEvents = events.filter((event) => event.action === "search_query" && event.queryText);
  const searchVectorEntries = await Promise.all(
    searchEvents.map(async (event) => ({
      eventId: String(event._id),
      vector: await embeddingService.generateEmbedding(String(event.queryText)),
    }))
  );
  const searchVectorMap = new Map(searchVectorEntries.map((entry) => [entry.eventId, entry.vector]));

  const dimension = 384;
  const sumVector = new Array(dimension).fill(0);
  let totalWeight = 0;

  let views = 0;
  let clicks = 0;
  let searches = 0;

  for (const event of events) {
    const weight = actionWeight(event.action) * decayWeight(event.occurredAt);
    let vector: number[] | undefined;

    if (event.action === "search_query") {
      vector = searchVectorMap.get(String(event._id));
      searches += 1;
    } else {
      if (event.action === "deal_view") views += 1;
      if (event.action === "click_view_detail" || event.action === "click_external_link") clicks += 1;
      vector = event.dealId ? embeddingMap.get(event.dealId) : undefined;
    }

    if (!vector) continue;

    for (let i = 0; i < dimension; i += 1) {
      sumVector[i] += vector[i] * weight;
    }
    totalWeight += weight;
  }

  if (!totalWeight) {
    return {
      coldStart: true,
      profileVector: null,
      signalsUsed: { views, clicks, searches },
      confidenceScore: 0,
    };
  }

  const profileVector = normalize(sumVector.map((value) => value / totalWeight));
  const confidenceScore = Math.min(1, totalWeight / 10);

  await UserProfileModel.updateOne(
    { userId },
    {
      $set: {
        userId,
        profileVector,
        vectorModel: env.EMBEDDING_MODEL,
        vectorVersion: env.EMBEDDING_VERSION,
        signalsUsed: { views, clicks, searches },
        confidenceScore,
        computedAt: new Date(),
      },
    },
    { upsert: true }
  );

  return {
    coldStart: false,
    profileVector,
    signalsUsed: { views, clicks, searches },
    confidenceScore,
  };
}
