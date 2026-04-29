import { Router } from "express";
import {
  approveBrand,
  createBrand,
  createManualDeal,
  deleteManualDeal,
  getBrandByPublicId,
  listBrandDeals,
  listPendingBrands,
  rejectBrand,
} from "../controllers/brandAdmin.controller.js";

export const brandAdminRouter = Router();

brandAdminRouter.post("/", createBrand);
brandAdminRouter.get("/pending", listPendingBrands);
brandAdminRouter.get("/by-brand-id/:brandId", getBrandByPublicId);
brandAdminRouter.patch("/:brandId/approve", approveBrand);
brandAdminRouter.patch("/:brandId/reject", rejectBrand);
brandAdminRouter.get("/:brandId/deals", listBrandDeals);
brandAdminRouter.post("/:brandId/deals", createManualDeal);
brandAdminRouter.delete("/:brandId/deals/:dealId", deleteManualDeal);
