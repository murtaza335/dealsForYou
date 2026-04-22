import amqplib, { type Channel, type ChannelModel, type ConsumeMessage } from "amqplib";
import { buildDealText } from "../utils/dealTextBuilder.js";
import { embeddingService } from "./embeddingService.js";
import { env } from "../config/env.js";

let connection: ChannelModel | null = null;
let channel: Channel | null = null;

type DealEventPayload = {
  eventType: "deal_created" | "deal_updated" | "deal_status_changed";
  dealId: string;
  brandId: string;
  dealData: {
    title: string;
    description?: string;
    price: number;
    discountPercent?: number;
    minPersons?: number;
    maxPersons?: number;
    cuisineTags?: string[];
    mealType?: string[];
    isHot?: boolean;
    viewsCount?: number;
    isActive?: boolean;
    isExpired?: boolean;
    endTime?: string | Date | null;
    brandName?: string;
    locations?: string[];
  };
};

async function handleMessage(msg: ConsumeMessage) {
  const payload = JSON.parse(msg.content.toString()) as DealEventPayload;
  const { dealId, brandId, dealData } = payload;

  const text = buildDealText(
    {
      title: dealData.title,
      description: dealData.description,
      price: dealData.price,
      discountPercent: dealData.discountPercent,
      cuisineTags: dealData.cuisineTags,
      mealType: dealData.mealType,
      minPersons: dealData.minPersons,
      maxPersons: dealData.maxPersons,
      endTime: dealData.endTime,
      locations: dealData.locations,
    },
    { name: dealData.brandName || "Unknown brand" }
  );

  await embeddingService.embedAndStoreDeal({
    dealId,
    brandId,
    brandSlug: dealData.brandName ?? "unknown-brand",
    title: dealData.title,
    description: dealData.description,
    price: dealData.price,
    discountPercent: dealData.discountPercent,
    minPersons: dealData.minPersons,
    maxPersons: dealData.maxPersons,
    cuisineTags: dealData.cuisineTags,
    mealType: dealData.mealType,
    isHot: dealData.isHot,
    viewsCount: dealData.viewsCount,
    isActive: dealData.isActive,
    isExpired: dealData.isExpired,
    endTime: dealData.endTime,
    locations: dealData.locations,
    text,
  });
}

export async function initRabbitMQSubscriber(): Promise<void> {
  connection = await amqplib.connect(env.RABBITMQ_URL);
  channel = await connection.createChannel();

  connection.on("error", (error) => {
    console.error("RabbitMQ connection error:", error);
  });

  connection.on("close", () => {
    console.warn("RabbitMQ connection closed.");
  });

  channel.on("error", (error) => {
    console.error("RabbitMQ channel error:", error);
  });

  channel.on("close", () => {
    console.warn("RabbitMQ channel closed.");
  });

  await channel.assertExchange("deals.events", "direct", { durable: true });
  await channel.assertQueue("recommendation.deals.embedding.queue", { durable: true });

  await channel.bindQueue("recommendation.deals.embedding.queue", "deals.events", "deal_created");
  await channel.bindQueue("recommendation.deals.embedding.queue", "deals.events", "deal_updated");
  await channel.bindQueue("recommendation.deals.embedding.queue", "deals.events", "deal_status_changed");

  await channel.consume(
    "recommendation.deals.embedding.queue",
    async (msg) => {
      if (!msg || !channel) return;

      try {
        await handleMessage(msg);
        channel.ack(msg);
      } catch (error) {
        console.error("Embedding consumer failed:", error);
        channel.nack(msg, false, true);
      }
    },
    { noAck: false }
  );
}

export async function closeSubscriber(): Promise<void> {
  if (channel) {
    await channel.close();
    channel = null;
  }

  if (connection) {
    await connection.close();
    connection = null;
  }
}
