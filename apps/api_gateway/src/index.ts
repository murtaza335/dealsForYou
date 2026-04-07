import { Router } from "express";
import { healthCheck } from "./controllers/healthcontroller.js";

const router = Router();

router.get("/health", healthCheck);

export default router;
