import { Router } from "express";
import { getTrendingDeals, getTrendingBrands } from "../controllers/analyticsController.js";

const router = Router();

router.get("/trending/deals", getTrendingDeals);
router.get("/trending/brands", getTrendingBrands);

export default router;
