import dotenv from "dotenv";
dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function resolveEmbeddingModel(): string {
  const configured = process.env.EMBEDDING_MODEL?.trim();

  // Guard against older OpenAI env values being reused with local Xenova embeddings.
  if (!configured || configured.startsWith("text-embedding-")) {
    return "Xenova/all-MiniLM-L6-v2";
  }

  return configured;
}

export const env = {
  PORT: Number(process.env.PORT || 3005),
  MONGO_URI_RECOMMENDATION_SERVICE: required("MONGO_URI_RECOMMENDATION_SERVICE"),
  RABBITMQ_URL: process.env.RABBITMQ_URL || "amqp://localhost:5672",
  EMBEDDING_MODEL: resolveEmbeddingModel(),
  EMBEDDING_VERSION: Number(process.env.EMBEDDING_VERSION || 1),
  VECTOR_INDEX_NAME: process.env.VECTOR_INDEX_NAME || "deal_embedding_index",
  RECOMMENDATION_CANDIDATES: Number(process.env.RECOMMENDATION_CANDIDATES || 100),
  RECOMMENDATION_LIMIT: Number(process.env.RECOMMENDATION_LIMIT || 20),
};
