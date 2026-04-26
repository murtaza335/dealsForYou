import { Router } from "express";
import {
  getFilteredDeals,
  getRecommendedDeals,
  getTopDeals,
  getBrands,
} from "../controllers/dealsController";

const router = Router();

router.get("/filtered", getFilteredDeals);
router.get("/recommended", getRecommendedDeals);
router.get("/top", getTopDeals);
router.get("/brands", getBrands);

export default router;
