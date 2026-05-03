import { Router } from "express";
import { getBrandsInfo } from "../controllers/brandControllers.js";

const router = Router();

router.get("/brands-info", getBrandsInfo);

export default router;