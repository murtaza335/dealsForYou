import { Router } from "express";
import { getDeals, getBrands } from "../controllers/deals.controller.js";

export const dealsRouter = Router();

dealsRouter.get("/", getDeals);
dealsRouter.get("/brands", getBrands);