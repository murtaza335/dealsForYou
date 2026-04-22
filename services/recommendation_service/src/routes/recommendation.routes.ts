import express from 'express';
import { UserEventModel } from '../models/userEvent.model.js';
import { DealEmbeddingModel } from '../models/dealEmbedding.model.js';

const router = express.Router();

/**
 * Build a user preference vector from their interaction history.
 * Weights: click (0.55) > view (0.30) > search (0.15)
 * Why: Recent clicks stronger signal than old views.
 */
async function buildUserVector(userId: string): Promise<number[] | null> {
  const events = await UserEventModel.find({ userId })
    .sort({ occurredAt: -1 })
    .limit(100); // Use last 100 events

  if (events.length === 0) {
    return null; // Cold start
  }

  // Fetch embeddings for all interacted deals
  const dealIds = events
    .map(e => e.dealId)
    .filter((id): id is string => id !== null && id !== undefined);
  
  if (dealIds.length === 0) {
    return null; // No valid deals interacted with
  }
  
  const embeddings = await DealEmbeddingModel.find({ dealId: { $in: dealIds } });

  // Create a map for quick lookup
  const embeddingMap = new Map(embeddings.map(e => [e.dealId, e.embedding]));

  // Weighted average
  let sumVector = new Array(384).fill(0);
  let totalWeight = 0;

  events.forEach((event) => {
    if (!event.dealId) return; // Skip null dealIds
    const embedding = embeddingMap.get(event.dealId);
    if (!embedding) return;

    const weight =
      event.action === 'click_view_detail'
        ? 0.55
        : event.action === 'deal_view'
          ? 0.30
          : event.action === 'search_query'
            ? 0.15
            : 0.1;
    embedding.forEach((val, idx) => {
      sumVector[idx] += val * weight;
    });
    totalWeight += weight;
  });

  // Normalize
  if (totalWeight === 0) return null;
  sumVector = sumVector.map(v => v / totalWeight);
  return sumVector;
}

/**
 * GET /api/recommendations/:userId
 * Returns top-K semantically similar deals.
 */
router.get('/recommendations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { k = 20 } = req.query; // Top-K results

    // Build user vector
    const userVector = await buildUserVector(userId);

    if (!userVector) {
      // Cold start: return empty or hot deals
      return res.json({
        recommendations: [],
        coldStart: true,
        message: 'No interaction history. Please view some deals.',
      });
    }

    // Query Atlas vector search
    const results = await DealEmbeddingModel.aggregate([
      {
        $search: {
          cosmosSearch: {
            vector: userVector,
            k: parseInt(k as string),
          },
          returnStoredSource: true,
        },
      },
      {
        $project: {
          similarityScore: { $meta: 'searchScore' },
          dealId: 1,
          embedding: 1,
        },
      },
    ]);

    res.json({
      recommendations: results,
      coldStart: false,
      userVectorDim: userVector.length,
    });
  } catch (err) {
    console.error('Recommendations error:', err);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

export default router;