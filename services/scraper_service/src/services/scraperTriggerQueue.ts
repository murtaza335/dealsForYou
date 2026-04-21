import amqp, { Channel, ChannelModel, Connection, ConsumeMessage } from "amqplib";

interface TriggerPayload {
  slug: string;
}

export class ScraperTriggerQueue {
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;

  private readonly exchange = "scraper_trigger_exchange";
  private readonly queue = "scraper_trigger_queue";

  
  async init(): Promise<void> {
    if (this.connection && this.channel) return;

    this.connection = await amqp.connect("amqp://localhost:5672");
    this.channel = await this.connection.createChannel();

    const channel = this.channel;

    await channel.assertExchange(this.exchange, "x-delayed-message", {
      durable: true,
      arguments: { "x-delayed-type": "direct" }
    });

    await channel.assertQueue(this.queue, { durable: true });
    await channel.bindQueue(this.queue, this.exchange, "");
  }

  async hardReset(): Promise<void> {
      if (!this.channel) await this.init();
    const channel = this.channel;

    if (!channel) {
      throw new Error("RabbitMQ channel is not initialized");
    }

    console.log("Starting hard reset of RabbitMQ structures...");

    // 1. Delete the exchange (kills all messages currently waiting on timers)
    await channel.deleteExchange(this.exchange);
    
    // 2. Delete the queue (kills all messages already waiting to be processed)
    await channel.deleteQueue(this.queue);

    // 3. Reset internal state so init() can run fresh
    this.connection = null;
    this.channel = null;

    // 4. Re-initialize to recreate the Exchange and Queue for immediate use
    await this.init();

    console.log("Queue and Exchange have been fully reset and recreated.");
  }

  async scheduleScraper(slug: string, delayMs: number): Promise<void> {
    if (!this.channel) await this.init();
    const channel = this.channel;

    if (!channel) {
      throw new Error("RabbitMQ channel is not initialized");
    }

    const payload: TriggerPayload = { slug };

    channel.publish(
      this.exchange,
      "",
      Buffer.from(JSON.stringify(payload)),
      {
        headers: { "x-delay": delayMs },
        persistent: true
      }
    );

    console.log(`Scheduled ${slug} in ${Math.round(delayMs / 1000)}s`);
  }

  async consume(
    handler: (payload: TriggerPayload) => Promise<void>
  ): Promise<void> {
    if (!this.channel) await this.init();
    const channel = this.channel;

    if (!channel) {
      throw new Error("RabbitMQ channel is not initialized");
    }

    await channel.consume(this.queue, async (msg: ConsumeMessage | null) => {
      if (!msg) return;

      try {
        const data: TriggerPayload = JSON.parse(msg.content.toString());

        await handler(data);

        channel.ack(msg);
      } catch (err) {
        console.error("Trigger job failed:", err);
        channel.nack(msg, false, false); // avoid infinite loop
      }
    });
  }
}

export const scraperTriggerQueue = new ScraperTriggerQueue();