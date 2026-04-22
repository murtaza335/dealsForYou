import amqp, { Channel, ChannelModel } from "amqplib";

let connection: ChannelModel | null = null;
let channel: Channel | null = null;

async function getChannel(): Promise<Channel> {
  if (channel) return channel;

  connection = await amqp.connect(process.env.RABBITMQ_URL || "amqp://localhost:5672");
  channel = await connection.createChannel();
  await channel.assertExchange("deals.events", "direct", { durable: true });

  return channel;
}

export async function publishDealEvent(
  routingKey: "deal_created" | "deal_updated" | "deal_status_changed",
  dealId: string,
  dealData: Record<string, unknown>,
  brandId: string
): Promise<void> {
  const ch = await getChannel();

  const payload = {
    eventType: routingKey,
    dealId,
    brandId,
    dealData,
    occurredAt: new Date().toISOString(),
  };

  ch.publish("deals.events", routingKey, Buffer.from(JSON.stringify(payload)), {
    persistent: true,
    contentType: "application/json",
  });
}

export async function publishDealCreated(dealId: string, dealData: Record<string, unknown>, brandId: string) {
  return publishDealEvent("deal_created", dealId, dealData, brandId);
}

export async function publishDealUpdated(dealId: string, dealData: Record<string, unknown>, brandId: string) {
  return publishDealEvent("deal_updated", dealId, dealData, brandId);
}

export async function closePublisher(): Promise<void> {
  if (channel) await channel.close();
  if (connection) await connection.close();
}
