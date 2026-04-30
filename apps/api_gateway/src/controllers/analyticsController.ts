import type { RequestHandler } from "express";
import { analyticsService } from "../services/analyticsService.js";

export const getTrendingDeals: RequestHandler = async (_req, res, next) => {
  try {
    const deals = await analyticsService.getTrendingDeals();

    res.status(200).json({
      success: true,
      data: deals,
      message: "Trending deals fetched successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getTrendingBrands: RequestHandler = async (_req, res, next) => {
  try {
    const brands = await analyticsService.getTrendingBrands();

    res.status(200).json({
      success: true,
      data: brands,
      message: "Trending brands fetched successfully",
    });
  } catch (error) {
    next(error);
  }
};
