import { Router } from "express";
import {
  getTrendingDeals,
  getTrendingBrands,
  trackEvent,
  getFavourites,
  getFavouritesDetails,
  addFavourite,
  removeFavourite,
} from "../controllers/analyticsController.js";
import { requireAuth } from "../middlewares/requireAuth.js";

const router = Router();
router.get("/trending/deals", getTrendingDeals);
router.get("/trending/brands", getTrendingBrands);
router.post("/event", trackEvent);

// Favourites routes
router.get("/favourites", requireAuth, getFavourites);
router.get("/favourites/details", requireAuth, getFavouritesDetails);
router.post("/favourites", requireAuth, addFavourite);
router.delete("/favourites", requireAuth, removeFavourite);

export default router;
