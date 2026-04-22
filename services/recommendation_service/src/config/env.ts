import dotenv from "dotenv";
dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const env = {
  PORT: Number(process.env.PORT || 3005),
  MONGO_URI_RECOMMENDATION_SERVICE: required("MONGO_URI_RECOMMENDATION_SERVICE"),
  RABBITMQ_URL: process.env.RABBITMQ_URL || "amqp://localhost:5672",
  EMBEDDING_MODEL: process.env.EMBEDDING_MODEL || "Xenova/all-MiniLM-L6-v2",
  EMBEDDING_VERSION: Number(process.env.EMBEDDING_VERSION || 1),
  VECTOR_INDEX_NAME: process.env.VECTOR_INDEX_NAME || "deal_embedding_index",
  RECOMMENDATION_CANDIDATES: Number(process.env.RECOMMENDATION_CANDIDATES || 100),
  RECOMMENDATION_LIMIT: Number(process.env.RECOMMENDATION_LIMIT || 20),
};
