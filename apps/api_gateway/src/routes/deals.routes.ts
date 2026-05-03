import { Router } from "express";
import {
  getDealById,
  getDealFilterBrands,
  getDealFilterCuisineTags,
  getDealFilterMealTypes,
  getDealFilterOptions,
  getDealFilterPriceRange,
  getFilteredDeals,
  getCurrentMoodDeals,
  getRecommendedDeals,
  getTopDeals,
  getBrands,
} from "../controllers/dealsController.js";
import { requireAuth } from "../middlewares/requireAuth.js";

const router = Router();

router.get("/filtered", getFilteredDeals);
router.get("/filters/options", getDealFilterOptions);
router.get("/filters/brands", getDealFilterBrands);
router.get("/filters/cuisine-tags", getDealFilterCuisineTags);
router.get("/filters/meal-types", getDealFilterMealTypes);
router.get("/filters/price-range", getDealFilterPriceRange);
router.get("/current-mood", requireAuth, getCurrentMoodDeals);
router.get("/recommended", requireAuth, getRecommendedDeals);
router.get("/top", getTopDeals);
router.get("/:dealId", getDealById);

export default router;
