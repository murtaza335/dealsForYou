import express, { NextFunction, Request, Response } from "express";
import { ENV } from "./config/env.js";
import { scraperControlRouter } from "./routes/scraper-control.routes.js";

const app = express();

app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ success: true, message: "Scraper service is running" });
});

app.use("/admin/scraper-sources", scraperControlRouter);

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof Error) {
    return res.status(400).json({ success: false, message: error.message });
  }

  return res.status(500).json({ success: false, message: "Internal server error" });
});

export const startHttpServer = () => {
  app.listen(Number(ENV.PORT), () => {
    console.log(`Scraper control API listening on port ${ENV.PORT}`);
  });
};
