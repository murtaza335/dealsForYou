import { Request, Response } from "express";
import { AnalyticsService } from "../services/analytics.service.js";

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