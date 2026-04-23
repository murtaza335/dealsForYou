import { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const message = err instanceof Error ? err.message : "Internal server error";

  console.error(`[Gateway] ${req.method} ${req.originalUrl} failed:`, err);

  res.status(500).json({
    success: false,
    message,
  });
};
