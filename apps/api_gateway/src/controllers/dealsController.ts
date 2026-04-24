import { RequestHandler } from "express";
import {
  dealsService,
  type FilteredDealsQuery,
  type RecommendedDealsQuery,
} from "../services/dealsService.js";

export const getFilteredDeals: RequestHandler = async (req, res, next) => {
  try {
    const query: FilteredDealsQuery = {
      brand: typeof req.query.brand === "string" ? req.query.brand : undefined,
      minPrice:
        typeof req.query.minPrice === "string" ? req.query.minPrice : undefined,
      maxPrice:
        typeof req.query.maxPrice === "string" ? req.query.maxPrice : undefined,
      query: typeof req.query.query === "string" ? req.query.query : undefined,
    };

    console.log("[Gateway] GET /api/deals/filtered query:", query);

    const deals = await dealsService.getFilteredDeals(query);

    console.log("[Gateway] Filtered deals fetched:", deals.length);

    res.status(200).json({
      success: true,
      data: deals,
      message: "Filtered deals fetched successfully",
    });
  } catch (error) {
    console.error("[Gateway] getFilteredDeals failed:", error);
    next(error);
  }
};

export const getRecommendedDeals: RequestHandler = async (req, res, next) => {
  try {
    const query: RecommendedDealsQuery = {
      userId: typeof req.query.userId === "string" ? req.query.userId : undefined,
      limit:
        typeof req.query.limit === "string" ? Number(req.query.limit) : undefined,
    };

    const deals = await dealsService.getRecommendedDeals(query);

    res.status(200).json({
      success: true,
      data: deals,
      message: "Recommended deals fetched successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getTopDeals: RequestHandler = async (req, res, next) => {
  try {
    const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : undefined;

    const deals = await dealsService.getTopDeals(limit);

    res.status(200).json({
      success: true,
      data: deals,
      message: "Top deals fetched successfully",
    });
  } catch (error) {
    next(error);
  }
};
