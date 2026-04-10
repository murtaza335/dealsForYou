import { Router } from "express";
import {
  getFilteredDeals,
  getRecommendedDeals,
  getTopDeals,
} from "../controllers/dealsController";

const router = Router();

router.get("/filtered", getFilteredDeals);
router.get("/recommended", getRecommendedDeals);
router.get("/top", getTopDeals);

export default router;
