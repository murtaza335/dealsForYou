import { Router } from "express";
import { getMe, onboardBrandAdmin, onboardConsumer, upsertFromClerk } from "../controllers/userController.js";

const router = Router();

router.get("/me", getMe);
router.post("/upsert-from-clerk", upsertFromClerk);
router.post("/onboard/consumer", onboardConsumer);
router.post("/onboard/brand-admin", onboardBrandAdmin);

export default router;
