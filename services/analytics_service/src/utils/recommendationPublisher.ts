import amqp, { type Channel, type ChannelModel } from "amqplib";

type RecommendationAction = "click_view_detail" | "click_external_link" | "search_query";

export type RecommendationEventPayload = {
  action: RecommendationAction;
  userId: string;
  dealId: string | null;
  queryText: string | null;
  source: string | null;
  sessionId: string;
  dwellTime: number | null;
  url: string | null;
  occurredAt: string;
};

let connection: ChannelModel | null = null;
let channel: Channel | null = null;

const QUEUE_NAME = "analytics_recommendation.queue";

async function getChannel(): Promise<Channel> {
  if (channel) return channel;

  const conn = await amqp.connect(process.env.RABBITMQ_URL || process.env.RABBITMQ_LOCAL_URL || "amqp://localhost:5672");
  const ch = await conn.createChannel();

  //  Direct queue instead of exchange
  await ch.assertQueue(QUEUE_NAME, { durable: true });

  connection = conn;
  channel = ch;

  return ch;
}

export async function publishRecommendationEvent(
  payload: RecommendationEventPayload
): Promise<void> {
  const ch = await getChannel();
  console.log(`Publishing recommendation event: ${JSON.stringify(payload)}`);
  ch.sendToQueue(
    QUEUE_NAME,
    Buffer.from(JSON.stringify(payload)),
    {
      persistent: true,
      contentType: "application/json",
    }
  );
  console.log("Recommendation event published successfully");
}

export async function closeRecommendationPublisher(): Promise<void> {
  await channel?.close();
  await connection?.close();
  channel = null;
  connection = null;
}
