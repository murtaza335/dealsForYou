import { Router } from "express";
import {
  approveBrand,
  deleteBrandAdmin,
  deleteEndUser,
  listBrandAdmins,
  listEndUsers,
  listPendingBrands,
  rejectBrand,
  suspendBrandAdmin,
} from "../controllers/brandAdminController.js";

const router = Router();

router.get("/brands/pending", listPendingBrands);
router.patch("/brands/:brandId/approve", approveBrand);
router.patch("/brands/:brandId/reject", rejectBrand);
router.get("/brand-admins", listBrandAdmins);
router.patch("/brand-admins/:userId/suspend", suspendBrandAdmin);
router.delete("/brand-admins/:userId", deleteBrandAdmin);
router.get("/end-users", listEndUsers);
router.delete("/end-users/:userId", deleteEndUser);

export default router;
