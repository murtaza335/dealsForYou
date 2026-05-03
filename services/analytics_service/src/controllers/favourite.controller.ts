import { Request, Response, NextFunction } from "express";
import { favouriteService } from "../services/favourite.service.js";

export const addFavourite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, dealExternalId, brandSlug } = req.body;

    if (!userId || !dealExternalId || !brandSlug) {
      return res.status(400).json({
        success: false,
        message: "userId, dealExternalId, and brandSlug are required",
      });
    }

    const result = await favouriteService.addFavourite(userId, dealExternalId, brandSlug);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const removeFavourite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, dealExternalId, brandSlug } = req.body;

    if (!userId || !dealExternalId || !brandSlug) {
      return res.status(400).json({
        success: false,
        message: "userId, dealExternalId, and brandSlug are required",
      });
    }

    const result = await favouriteService.removeFavourite(userId, dealExternalId, brandSlug);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getFavouriteDeals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = typeof req.query.userId === "string" ? req.query.userId : req.params.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    const result = await favouriteService.getFavouritesByUserId(userId as string);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getFavouritesWithDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = typeof req.query.userId === "string" ? req.query.userId : req.params.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    const dealsServiceUrl = process.env.DEALS_SERVICE_URL || "http://localhost:5002";
    const result = await favouriteService.getFavouriteDealsWithDetails(userId as string, dealsServiceUrl);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const checkIsFavourite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, dealExternalId, brandSlug } = req.query;

    if (!userId || !dealExternalId || !brandSlug) {
      return res.status(400).json({
        success: false,
        message: "userId, dealExternalId, and brandSlug query parameters are required",
      });
    }

    const result = await favouriteService.isFavourite(
      userId as string,
      dealExternalId as string,
      brandSlug as string
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
