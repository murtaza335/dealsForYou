import cors from "cors";
import dotenv from "dotenv";
import express, { type Application, type Request, type Response, type NextFunction } from "express";
import { notFoundHandler } from "./middlewares/notFoundHandler.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import recommendationRouter from "./routes/recommendation.routes.js";
import debugRouter from "./routes/debug.routes.js";
import { logger, type LogContext } from "./utils/logger.js";

dotenv.config();

const app: Application = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const logContext = logger.logRequest(req);
  
  // Store context in request for later use
  (req as any).logContext = logContext;

  // Log response when it's sent
  const originalSend = res.send;
  res.send = function (data: any) {
    logger.logResponse("Response sent", res.statusCode, logContext);
    return originalSend.call(this, data);
  };

  next();
});

app.use("/api", recommendationRouter);
app.use("/api/debug", debugRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
