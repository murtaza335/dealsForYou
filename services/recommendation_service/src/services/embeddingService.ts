import { pipeline } from "@xenova/transformers";
import { createHash } from "crypto";
import { DealEmbeddingModel } from "../models/dealEmbedding.model.js";
import { env } from "../config/env.js";

let embeddingPipeline: Awaited<ReturnType<typeof pipeline>> | null = null;

async function getEmbeddingPipeline() {
  if (!embeddingPipeline) {
    embeddingPipeline = await pipeline("feature-extraction", env.EMBEDDING_MODEL);
  }
  return embeddingPipeline;
}

export type EmbedDealPayload = {
  dealId: string;
  brandId: string;
  brandName: string;
  title: string;
  description?: string;
  price: number;
  discountPercent?: number;
  minPersons?: number;
  maxPersons?: number;
  cuisineTags?: string[];
  mealType?: string[];
  isHot?: boolean;
  viewsCount?: number;
  isActive?: boolean;
  isExpired?: boolean;
  endTime?: Date | string | null;
  locations?: string[];
  text: string;
};

export class EmbeddingService {
  async generateEmbedding(text: string): Promise<number[]> {
    const pipe = await getEmbeddingPipeline();
    const output = await pipe(text, {
      pooling: "mean",
      normalize: true,
    });
    return Array.from(output.data) as number[];
  }

  async embedAndStoreDeal(payload: EmbedDealPayload): Promise<void> {
    const embedding = await this.generateEmbedding(payload.text);
    const textHash = createHash("sha256").update(payload.text).digest("hex");

    await DealEmbeddingModel.updateOne(
      { dealId: payload.dealId },
      {
        $set: {
          dealId: payload.dealId,
          brandId: payload.brandId,
          brandName: payload.brandName,
          embedding,
          embeddingModel: env.EMBEDDING_MODEL,
          embeddingVersion: env.EMBEDDING_VERSION,
          textHash,
          sourceText: payload.text,
          isActive: payload.isActive ?? true,
          isExpired: payload.isExpired ?? false,
          price: payload.price,
          discountPercent: payload.discountPercent ?? 0,
          minPersons: payload.minPersons ?? 1,
          maxPersons: payload.maxPersons ?? 1,
          cuisineTags: payload.cuisineTags ?? [],
          mealType: payload.mealType ?? [],
          isHot: payload.isHot ?? false,
          viewsCount: payload.viewsCount ?? 0,
          locations: payload.locations ?? [],
          endTime: payload.endTime ? new Date(payload.endTime) : null,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );
  }
}

export const embeddingService = new EmbeddingService();
