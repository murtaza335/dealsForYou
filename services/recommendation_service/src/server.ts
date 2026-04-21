import app from "./app.js";
import { ENV } from "./config/env.js";

export const startServer = () => {
  app.listen(Number(ENV.PORT), () => {
    console.log(`Recommendation service running on http://localhost:${ENV.PORT}`);
  });
};