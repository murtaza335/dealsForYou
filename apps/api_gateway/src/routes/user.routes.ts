import { Router } from "express";
import { getMe, onboardBrandAdmin, onboardConsumer } from "../controllers/userController.js";

const router = Router();

router.get("/me", getMe);
router.post("/onboard/consumer", onboardConsumer);
router.post("/onboard/brand-admin", onboardBrandAdmin);

export default router;
