import amqplib, { type Channel, type ChannelModel, type ConsumeMessage } from "amqplib";
import { buildDealText } from "../utils/dealTextBuilder.js";
import { embeddingService } from "./embeddingService.js";
import { env } from "../config/env.js";
import { UserEventModel } from "../models/userEvent.model.js";
import { updateUserMoodProfile } from "./userMoodProfile.service.js";
import { logger } from "../utils/logger.js";

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

type AnalyticsEventPayload = {
  action: "click_view_detail" | "click_external_link" | "search_query";
  userId: string;
  dealId: string | null;
  queryText: string | null;
  source: string | null;
  sessionId: string;
  dwellTime: number | null;
  url: string | null;
  occurredAt: string;
};

async function handleMessage(msg: ConsumeMessage) {
  const payload = JSON.parse(msg.content.toString()) as DealEventPayload;
  const { dealId, brandId, dealData } = payload;

  logger.debug("Received deal event", payload.eventType, dealId);

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
  logger.info("Processed deal embedding for", dealId);
}

async function handleAnalyticsMessage(msg: ConsumeMessage) {
  const payload = JSON.parse(msg.content.toString()) as AnalyticsEventPayload;
  const occurredAt = payload.occurredAt ? new Date(payload.occurredAt) : new Date();

  logger.debug("Received analytics event", payload.action, payload.userId, payload.dealId);

  await UserEventModel.create({
    userId: payload.userId,
    dealId: payload.dealId,
    action: payload.action,
    queryText: payload.queryText ?? null,
    metadata: {
      source: payload.source ?? "unknown",
      sessionId: payload.sessionId,
      dwellTime: payload.dwellTime ?? null,
      url: payload.url ?? null,
    },
    occurredAt,
  });

  await updateUserMoodProfile({
    userId: payload.userId,
    sessionId: payload.sessionId,
    action: payload.action,
    dealId: payload.dealId,
    queryText: payload.queryText,
    occurredAt,
  });
  logger.info("Processed analytics event", payload.action, payload.userId || "unknown");
}

export async function initRabbitMQSubscriber(): Promise<void> {
  connection = await amqplib.connect(process.env.RABBITMQ_URL || process.env.RABBITMQ_LOCAL_URL || "amqp://localhost:5672");
  channel = await connection.createChannel();

  connection.on("error", (error) => {
    logger.error("RabbitMQ connection error:", error);
  });

  connection.on("close", () => {
    logger.warn("RabbitMQ connection closed.");
  });

  channel.on("error", (error) => {
    logger.error("RabbitMQ channel error:", error);
  });

  channel.on("close", () => {
    logger.warn("RabbitMQ channel closed.");
  });

  await channel.assertExchange("deals.events", "direct", { durable: true });
  await channel.assertQueue("recommendation.deals.embedding.queue", { durable: true });
  await channel.assertQueue("analytics_recommendation.queue", { durable: true });

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
        logger.error("Embedding consumer failed:", error);
        channel.nack(msg, false, true);
      }
    },
    { noAck: false }
  );

  await channel.consume(
    "analytics_recommendation.queue",
    async (msg) => {
      if (!msg || !channel) return;

      try {
        await handleAnalyticsMessage(msg);
        channel.ack(msg);
      } catch (error) {
        logger.error("Analytics queue consumer failed:", error);
        channel.nack(msg, false, false);
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



