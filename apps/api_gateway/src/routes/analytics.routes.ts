import { Router } from "express";
import { getTrendingDeals, getTrendingBrands, trackEvent } from "../controllers/analyticsController.js";
import { requireAuth } from "../middlewares/requireAuth.js";

const router = Router();
router.get("/trending/deals", getTrendingDeals);
router.get("/trending/brands", getTrendingBrands);
router.post("/event", trackEvent);

export default router;
