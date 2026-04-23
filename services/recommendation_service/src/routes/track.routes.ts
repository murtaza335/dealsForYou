import { Router } from "express";
import {
  trackDealView,
  trackExternalLink,
  trackSearchQuery,
  trackViewDetail,
} from "../controllers/track.controller.js";

export const trackRouter = Router();

trackRouter.post("/view-detail", trackViewDetail);
trackRouter.post("/external-link", trackExternalLink);
trackRouter.post("/deal-view", trackDealView);
trackRouter.post("/search-query", trackSearchQuery);
