import type { NextFunction, Request, Response } from "express";
import { brandService } from "../services/brand.service.js";

const parseStringListQuery = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .flatMap((entry) => `${entry}`.split(","))
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }

  return [];
};

export const getFilterBrands = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const brands = await brandService.getFilterBrands();

    return res.status(200).json({
      success: true,
      message: "Filter brands fetched successfully.",
      data: brands,
    });
  } catch (error) {
    next(error);
  }
};

export const getBrands = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const brands = await brandService.getFilterBrands();

    return res.status(200).json({
      success: true,
      message: "Brands fetched successfully.",
      data: brands,
    });
  } catch (error) {
    next(error);
  }
};

export const searchBrands = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const values = parseStringListQuery(req.query.values ?? req.query.brands ?? req.query.q);

    if (!values.length) {
      return res.status(400).json({
        success: false,
        message: "values query parameter is required.",
      });
    }

    const brands = await brandService.getBrandsByNamesOrSlugs(values);

    return res.status(200).json({
      success: true,
      message: "Brands searched successfully.",
      data: brands,
    });
  } catch (error) {
    next(error);
  }
};

export const upsertBrand = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const slug = typeof req.body?.slug === "string" ? req.body.slug.trim() : "";
    const baseUrl = typeof req.body?.baseUrl === "string" ? req.body.baseUrl.trim() : "";

    if (!name || !slug || !baseUrl) {
      return res.status(400).json({
        success: false,
        message: "name, slug, and baseUrl are required.",
      });
    }

    const brand = await brandService.upsertBrand({
      name,
      slug,
      baseUrl,
      logoUrl: typeof req.body?.logoUrl === "string" ? req.body.logoUrl.trim() : undefined,
      tagline: typeof req.body?.tagline === "string" ? req.body.tagline.trim() : undefined,
      description: typeof req.body?.description === "string" ? req.body.description.trim() : undefined,
    });

    return res.status(200).json({
      success: true,
      message: "Brand upserted successfully.",
      data: brand,
    });
  } catch (error) {
    next(error);
  }
};