import { Router } from "express";
import {
	getTrendingBrands,
	getTrendingDeals,
	getOverallExternalLinkCount,
	getExternalLinkCountByBrandSlug,
	getBrandDealViewsBySlug,
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

router.get("/metrics/external-links/count", getOverallExternalLinkCount);
router.get("/metrics/external-links/count/:brandSlug", getExternalLinkCountByBrandSlug);
router.get("/metrics/brands/:brandSlug/deal-views", getBrandDealViewsBySlug);

// Favourite routes
router.post("/favourites", addFavourite);
router.delete("/favourites", removeFavourite);
router.get("/favourites", getFavouriteDeals);
router.get("/favourites/details", getFavouritesWithDetails);
router.get("/favourites/check", checkIsFavourite);

export default router;