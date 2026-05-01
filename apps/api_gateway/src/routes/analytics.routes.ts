import { Router } from "express";
import { getTrendingDeals, getTrendingBrands } from "../controllers/analyticsController.js";
import { requireAuth } from "../middlewares/requireAuth.js";

const router = Router();
router.use(requireAuth);

router.get("/trending/deals", getTrendingDeals);
router.get("/trending/brands", getTrendingBrands);

export default router;
