import { Request, Response } from "express";
import { AnalyticsService } from "../services/analytics.service.js";
import { AnalyticsRepository } from "../repositories/analytics.repository.js";

export const trackEvent = async (req: Request, res: Response) => {
  try {
    const event = await AnalyticsService.trackEvent(req.body);

    res.status(201).json({
      success: true,
      data: event,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to track event",
    });
  }
};

export const getTrendingDeals = async (req: Request, res: Response) => {
  try {
    const deals = await AnalyticsService.getTrendingDeals();

    res.status(200).json({
      success: true,
      data: deals,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch trending deals",
    });
  }
};

export const getTrendingBrands = async (req: Request, res: Response) => {
  try {
    const brands = await AnalyticsService.getTrendingBrands();

    res.status(200).json({
      success: true,
      data: brands,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch trending brands",
    });
  }
};

export const getOverallExternalLinkCount = async (req: Request, res: Response) => {
  try {
    const count = await AnalyticsRepository.getOverallExternalLinkCount();

    res.status(200).json({
      success: true,
      data: {
        externalLinkCount: count,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch overall external link count",
    });
  }
};

export const getExternalLinkCountByBrandSlug = async (req: Request, res: Response) => {
  try {
    const brandSlug = typeof req.params.brandSlug === "string" ? req.params.brandSlug.trim() : "";

    if (!brandSlug) {
      return res.status(400).json({
        success: false,
        error: "brandSlug is required",
      });
    }

    const count = await AnalyticsRepository.getExternalLinkCountByBrandSlug(brandSlug);

    res.status(200).json({
      success: true,
      data: {
        brandSlug,
        externalLinkCount: count,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch external link count for brand",
    });
  }
};

export const getBrandDealViewsBySlug = async (req: Request, res: Response) => {
  try {
    const brandSlug = typeof req.params.brandSlug === "string" ? req.params.brandSlug.trim() : "";

    if (!brandSlug) {
      return res.status(400).json({
        success: false,
        error: "brandSlug is required",
      });
    }

    const stats = await AnalyticsRepository.getBrandDealViewStatsBySlug(brandSlug);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch deal views for brand",
    });
  }
};