import { Router } from "express";
import {
  activateScraperSource,
  createScraperSource,
  deactivateScraperSource,
  getScraperSourceBySlug,
  listScraperSources,
  updateScraperSource
} from "../controllers/scraper-control.controller.js";

export const scraperControlRouter = Router();

scraperControlRouter.get("/", listScraperSources);
scraperControlRouter.get("/:slug", getScraperSourceBySlug);
scraperControlRouter.post("/", createScraperSource);
scraperControlRouter.patch("/:slug", updateScraperSource);
scraperControlRouter.patch("/:slug/activate", activateScraperSource);
scraperControlRouter.patch("/:slug/deactivate", deactivateScraperSource);
