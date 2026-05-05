import type { Server } from "node:http";
import app from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";

export function startServer(): Server {
  const server = app.listen(env.PORT, () => {
    logger.info(`Recommendation service running on http://localhost:${env.PORT}`);
  });

  return server;
}