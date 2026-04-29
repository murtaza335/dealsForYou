import { Router } from "express";
import { approveBrand, listPendingBrands, rejectBrand } from "../controllers/brandAdminController.js";

const router = Router();

router.get("/brands/pending", listPendingBrands);
router.patch("/brands/:brandId/approve", approveBrand);
router.patch("/brands/:brandId/reject", rejectBrand);

export default router;
