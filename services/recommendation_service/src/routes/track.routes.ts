import { Router } from "express";
import { trackViewDetail, trackExternalLink } from "../controllers/track.controller.js";

export const trackRouter = Router();

/**
 * POST /api/track/view-detail
 * Fired when user clicks "View Details" button on a deal card
 */
trackRouter.post("/view-detail", trackViewDetail);

/**
 * POST /api/track/external-link
 * Fired when user clicks a link to the restaurant site
 */
trackRouter.post("/external-link", trackExternalLink);