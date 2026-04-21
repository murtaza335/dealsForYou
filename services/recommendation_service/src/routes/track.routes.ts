import { Router } from "express";
import { trackClick } from "../controllers/track.controller.js";

export const trackRouter = Router();

trackRouter.post("/track_click", trackClick);