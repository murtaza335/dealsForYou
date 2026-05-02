import { Router } from "express";
import {
  createMyDeal,
  deleteMyDeal,
  getMyBrand,
  getMyDeals,
} from "../controllers/brandAdminController.js";

const router = Router();

router.get("/brand", getMyBrand);
router.get("/deals", getMyDeals);
router.post("/deals", createMyDeal);
router.delete("/deals/:dealId", deleteMyDeal);

export default router;
