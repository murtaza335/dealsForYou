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
  EMBEDDING_MODEL: process.env.EMBEDDING_MODEL || "text-embedding-3-small",
  EMBEDDING_VERSION: Number(process.env.EMBEDDING_VERSION || 1),
};