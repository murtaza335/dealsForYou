import { Router } from "express";
import { getDeals } from "../controllers/deals.controller.js";

export const dealsRouter = Router();

dealsRouter.get("/", getDeals);