import type { ErrorRequestHandler } from "express";
import { logger } from "../utils/logger.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const message = err instanceof Error ? err.message : "Internal server error";
  logger.error("Unhandled error:", err);

  res.status(500).json({
    success: false,
    message,
  });
};