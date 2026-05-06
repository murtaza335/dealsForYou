import type { ErrorRequestHandler } from "express";
import { logger, type LogContext } from "../utils/logger.js";

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const logContext = (req as any).logContext as LogContext | undefined;
  const message = err instanceof Error ? err.message : "Internal server error";

  logger.error("Request failed - Internal server error", err, logContext);

  res.status(500).json({
    success: false,
    message,
  });
};