import type { NextFunction, Request, Response } from "express";
import { trackService } from "../services/track.service.js";

export const trackClick = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dealId = Number(req.body?.dealId);
    const userId = typeof req.body?.userId === "string" && req.body.userId.trim().length > 0 ? req.body.userId.trim() : null;

    const savedClick = await trackService.trackClick({ dealId, userId });

    return res.status(201).json({
      success: true,
      message: "Click tracked successfully.",
      data: savedClick,
    });
  } catch (error) {
    next(error);
  }
};