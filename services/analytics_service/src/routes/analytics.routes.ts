import { Router } from "express";
import {
	getTrendingBrands,
	getTrendingDeals,
	trackEvent,
} from "../controllers/analytics.controller.js";
import {
	addFavourite,
	removeFavourite,
	getFavouriteDeals,
	getFavouritesWithDetails,
	checkIsFavourite,
} from "../controllers/favourite.controller.js";

const router = Router();

router.post("/event", trackEvent);
router.get("/trending/deals", getTrendingDeals);
router.get("/trending/brands", getTrendingBrands);

// Favourite routes
router.post("/favourites", addFavourite);
router.delete("/favourites", removeFavourite);
router.get("/favourites", getFavouriteDeals);
router.get("/favourites/details", getFavouritesWithDetails);
router.get("/favourites/check", checkIsFavourite);

export default router;