import { Request, Response } from "express";
import { ScraperControlService } from "../services/scraperControl.service.js";

const scraperControlService = new ScraperControlService();
const getSlugParam = (req: Request) => String(req.params.slug || "");

export const listScraperSources = async (_req: Request, res: Response) => {
  const sources = await scraperControlService.list();
  res.json({ success: true, data: sources });
};

export const getScraperSourceBySlug = async (req: Request, res: Response) => {
  const source = await scraperControlService.getBySlug(getSlugParam(req));

  if (!source) {
    return res.status(404).json({ success: false, message: "Scraper source not found" });
  }

  return res.json({ success: true, data: source });
};

export const createScraperSource = async (req: Request, res: Response) => {
  const source = await scraperControlService.create(req.body);
  res.status(201).json({ success: true, data: source });
};

export const updateScraperSource = async (req: Request, res: Response) => {
  const source = await scraperControlService.update(getSlugParam(req), req.body);

  if (!source) {
    return res.status(404).json({ success: false, message: "Scraper source not found" });
  }

  return res.json({ success: true, data: source });
};

export const activateScraperSource = async (req: Request, res: Response) => {
  const source = await scraperControlService.activate(getSlugParam(req));

  if (!source) {
    return res.status(404).json({ success: false, message: "Scraper source not found" });
  }

  return res.json({ success: true, data: source });
};

export const deactivateScraperSource = async (req: Request, res: Response) => {
  const source = await scraperControlService.deactivate(getSlugParam(req));

  if (!source) {
    return res.status(404).json({ success: false, message: "Scraper source not found" });
  }

  return res.json({ success: true, data: source });
};
