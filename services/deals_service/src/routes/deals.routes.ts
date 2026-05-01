import { Router } from "express";
import {
	getDealById,
	getDealsByIds,
	getDeals,
	getFilterCuisineTags,
	getFilterMealTypes,
	getFilterOptions,
	getFilterPriceRange,
} from "../controllers/deals.controller.js";
import {
	getBrands,
	getFilterBrands,
	searchBrands,
	upsertBrand,
} from "../controllers/brand.controller.js";

export const dealsRouter = Router();

dealsRouter.get("/filters/options", getFilterOptions);
dealsRouter.get("/brands", getBrands);
dealsRouter.get("/filters/brands", getFilterBrands);
dealsRouter.get("/brands/search", searchBrands);
dealsRouter.get("/filters/cuisine-tags", getFilterCuisineTags);
dealsRouter.get("/filters/meal-types", getFilterMealTypes);
dealsRouter.get("/filters/price-range", getFilterPriceRange);
dealsRouter.post("/brands", upsertBrand);

dealsRouter.get("/", getDeals);
dealsRouter.get("/filtered", getDeals);
dealsRouter.get("/bulk", getDealsByIds);
dealsRouter.get("/:dealId", getDealById);
