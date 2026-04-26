import { Router } from "express";
import {
	getTrendingBrands,
	getTrendingDeals,
	trackEvent,
} from "../controllers/analytics.controller.js";

const router = Router();

router.post("/event", trackEvent);
router.get("/trending/deals", getTrendingDeals);
router.get("/trending/brands", getTrendingBrands);

export default router;