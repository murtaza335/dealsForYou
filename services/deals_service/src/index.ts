import express, { Request, Response } from "express";
import { rabbitMQSubscriber } from "./services/rabbitmq.subscriber.js";
import "dotenv/config";
import { connectDB } from "./config/db.js";
import { dealsRouter } from "./routes/deals.routes.js";

const app = express();
const PORT = process.env.SERVICE_PORT_DEALS_SERVICE || 5000;

app.use(express.json());

app.use("/api/deals", dealsRouter);
 
app.get("/", (req: Request, res: Response) => {
    res.send("Caching Service is Up!");
});

app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);

    await rabbitMQSubscriber.init();
    connectDB();
});