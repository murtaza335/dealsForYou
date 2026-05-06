import { DealEmbeddingModel } from "../models/dealEmbedding.model.js";
import { UserMoodProfileModel } from "../models/userMoodProfile.model.js";
import { embeddingService } from "./embeddingService.js";
import { logger } from "../utils/logger.js";

type MoodAction = "click_view_detail" | "click_external_link" | "search_query";

export type UpdateMoodProfilePayload = {
  userId: string;
  sessionId: string;
  action: MoodAction;
  dealId: string | null;
  queryText: string | null;
  occurredAt: Date;
};

const MOOD_TTL_MS = 2 * 60 * 60 * 1000;
const MAX_SOURCE_DEAL_IDS = 20;

function actionWeight(action: MoodAction): number {
  if (action === "click_external_link") return 0.7;
  if (action === "click_view_detail") return 0.55;
  if (action === "search_query") return 0.4;
  return 0.3;
}

function normalize(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (!magnitude) return vector;
  return vector.map((value) => value / magnitude);
}

function blendVectors(existingVector: number[] | undefined, nextVector: number[], weight: number) {
  if (!existingVector?.length) return normalize(nextVector);

  const dimension = Math.min(existingVector.length, nextVector.length);
  const blended = new Array(dimension);

  for (let i = 0; i < dimension; i += 1) {
    blended[i] = existingVector[i] * (1 - weight) + nextVector[i] * weight;
  }

  return normalize(blended);
}

async function resolveEventVector(payload: UpdateMoodProfilePayload): Promise<number[] | null> {
  if (payload.action === "search_query") {
    const queryText = payload.queryText?.trim();
    return queryText ? embeddingService.generateEmbedding(queryText) : null;
  }

  if (!payload.dealId) return null;

  const dealEmbedding = await DealEmbeddingModel.findOne({ dealId: payload.dealId })
    .select("embedding")
    .lean();

  return dealEmbedding?.embedding ?? null;
}

export async function updateUserMoodProfile(payload: UpdateMoodProfilePayload): Promise<void> {
  logger.debug("updateUserMoodProfile called", payload.userId, payload.sessionId, payload.action);
  if (!payload.userId || !payload.sessionId) return;

  const vector = await resolveEventVector(payload);
  if (!vector) {
    logger.debug("No vector resolved for payload", payload);
    return;
  }

  const existing = await UserMoodProfileModel.findOne({
    userId: payload.userId,
    sessionId: payload.sessionId,
  }).lean();

  const moodVector = blendVectors(existing?.moodVector, vector, actionWeight(payload.action));
  const sourceDealIds = payload.dealId
    ? [payload.dealId, ...(existing?.sourceDealIds ?? []).filter((dealId) => dealId !== payload.dealId)].slice(
        0,
        MAX_SOURCE_DEAL_IDS
      )
    : existing?.sourceDealIds ?? [];

  const signalsUsed = {
    views: existing?.signalsUsed?.views ?? 0,
    clicks: existing?.signalsUsed?.clicks ?? 0,
    searches: existing?.signalsUsed?.searches ?? 0,
  };

  if (payload.action === "click_view_detail" || payload.action === "click_external_link") signalsUsed.clicks += 1;
  if (payload.action === "search_query") signalsUsed.searches += 1;

  await UserMoodProfileModel.updateOne(
    { userId: payload.userId, sessionId: payload.sessionId },
    {
      $set: {
        userId: payload.userId,
        sessionId: payload.sessionId,
        moodVector,
        signalsUsed,
        sourceDealIds,
        lastEventAt: payload.occurredAt,
        expiresAt: new Date(Date.now() + MOOD_TTL_MS),
      },
    },
    { upsert: true }
  );
  logger.debug("Updated mood profile for", payload.userId, payload.sessionId);
}
