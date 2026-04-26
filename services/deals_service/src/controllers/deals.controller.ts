import type { NextFunction, Request, Response } from "express";
import { DealFilters } from "../repositories/deal.repository.js";
import { dealsService } from "../services/deals.service.js";

const parseNumberQuery = (value: unknown): number | undefined => {
  if (typeof value !== "string" || value.trim().length === 0) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

export const getBrands = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const brands = [
      { name: "KFC", slug: "kfc" },
      { name: "Dominos", slug: "dominos" }
    ];

    return res.status(200).json({
      success: true,
      message: "Brands fetched successfully.",
      data: brands,
    });
  } catch (error) {
    next(error);
  }
};

export const getDeals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const minPrice = parseNumberQuery(req.query.minPrice);
    const maxPrice = parseNumberQuery(req.query.maxPrice);

    if (Number.isNaN(minPrice) || Number.isNaN(maxPrice)) {
      return res.status(400).json({
        success: false,
        message: "Invalid price filter. Use numeric values for minPrice and maxPrice.",
      });
    }

    if (typeof minPrice === "number" && typeof maxPrice === "number" && minPrice > maxPrice) {
      return res.status(400).json({
        success: false,
        message: "minPrice cannot be greater than maxPrice.",
      });
    }

    const query = typeof req.query.query === "string" ? req.query.query : undefined;
    const brand = typeof req.query.brand === "string" ? req.query.brand : undefined;

    const filters: DealFilters = {
      minPrice,
      maxPrice,
      query,
      brand,
    };

    const deals = await dealsService.getDeals(filters);

    return res.status(200).json({
      success: true,
      message: "Deals fetched successfully.",
      data: deals,
    });
  } catch (error) {
    next(error);
  }
};