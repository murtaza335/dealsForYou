import type { Server } from "node:http";
import app from "./app.js";
import { env } from "./config/env.js";

export function startServer(): Server {
  const server = app.listen(env.PORT, () => {
    console.log(`Recommendation service running on http://localhost:${env.PORT}`);
  });

  return server;
}