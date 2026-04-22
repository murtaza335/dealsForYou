import { pipeline } from '@xenova/transformers';
import { createHash } from 'crypto';
import { DealEmbeddingModel } from '../models/dealEmbedding.model.js';

let embeddingPipeline: any = null;

/**
 * Lazy-load the embedding model on first call.
 * Why: Model file (~80MB) loads to memory only once, reused for all calls.
 */
async function getEmbeddingPipeline() {
  if (!embeddingPipeline) {
    console.log('Loading all-MiniLM-L6-v2 model...');
    embeddingPipeline = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    );
    console.log('Model loaded.');
  }
  return embeddingPipeline;
}

export class EmbeddingService {
  /**
   * Generate embedding for text.
   * Input: text (string)
   * Output: vector (384-dim array of floats)
   * Why separate from storage: testable, reusable.
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const pipe = await getEmbeddingPipeline();
    
    const output = await pipe(text, {
      pooling: 'mean', // Average token embeddings
      normalize: true, // L2 normalization for cosine similarity
    });
    
    // Convert tensor to Array
    return Array.from(output.data) as number[];
  }

  /**
   * Generate embedding and store in MongoDB.
   * Input: dealId (string), text (string)
   * Side effect: Creates or updates deal_embeddings doc
   */
  async embedAndStore(dealId: string, text: string): Promise<void> {
    const embedding = await this.generateEmbedding(text);
    const textHash = createHash('sha256').update(text).digest('hex');

    await DealEmbeddingModel.updateOne(
      { dealId },
      {
        $set: {
          dealId,
          embedding, // 384-dim vector
          embeddingModel: 'all-MiniLM-L6-v2',
          embeddingVersion: 1,
          textHash, // If text changes, you know embedding is stale
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    console.log(`✓ Embedded deal ${dealId}`);
  }

  /**
   * Batch embed multiple texts (for backfill).
   * Why: Control parallelism to avoid memory issues.
   */
  async embedBatch(items: { dealId: string; text: string }[], batchSize = 5): Promise<void> {
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      await Promise.all(batch.map(item => this.embedAndStore(item.dealId, item.text)));
      console.log(`Progress: ${Math.min(i + batchSize, items.length)}/${items.length}`);
    }
  }
}

export const embeddingService = new EmbeddingService();