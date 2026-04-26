import { Router } from "express";
import {
  getDealById,
  getDealFilterBrands,
  getDealFilterCuisineTags,
  getDealFilterMealTypes,
  getDealFilterOptions,
  getDealFilterPriceRange,
  getFilteredDeals,
  getRecommendedDeals,
  getTopDeals,
  getBrands,
} from "../controllers/dealsController";

const router = Router();

router.get("/filtered", getFilteredDeals);
router.get("/filters/options", getDealFilterOptions);
router.get("/filters/brands", getDealFilterBrands);
router.get("/filters/cuisine-tags", getDealFilterCuisineTags);
router.get("/filters/meal-types", getDealFilterMealTypes);
router.get("/filters/price-range", getDealFilterPriceRange);
router.get("/recommended", getRecommendedDeals);
router.get("/top", getTopDeals);
<<<<<<< HEAD
router.get("/:dealId", getDealById);
=======
router.get("/brands", getBrands);
>>>>>>> master

export default router;
