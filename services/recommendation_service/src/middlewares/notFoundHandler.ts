import type { RequestHandler } from "express";
import { logger } from "../utils/logger.js";

export const notFoundHandler: RequestHandler = (req, res) => {
  logger.warn("Route not found", { method: req.method, endpoint: req.originalUrl });
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};