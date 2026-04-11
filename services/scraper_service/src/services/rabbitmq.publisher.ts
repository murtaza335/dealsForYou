import amqp, { Channel, ChannelModel, Connection } from "amqplib";

// we make the type for the class Rabbitmq
interface RabbitMQ {
  init(): Promise<void>;
  publishMessage(message: unknown): Promise<void>;
  close(): Promise<void>;
}

class RabbitMQService implements RabbitMQ {
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
  private readonly queue = "scraper_deals_queue";

  async init(): Promise<void> {
    if (this.connection && this.channel) return; // Already connected

    try {
      this.connection = await amqp.connect("amqp://localhost:5672");
      this.channel = await this.connection.createChannel();

      await this.channel.assertQueue(this.queue, { durable: true });

      console.log("RabbitMQ Connected");
    } catch (error) {
      console.error("RabbitMQ Connection Error:", error);
      throw error;
    }
  }

    async publishMessage(message: unknown): Promise<void> {
    if (!this.channel) {
      await this.init();
    }

    const buffer = Buffer.from(JSON.stringify(message));

    const sent = this.channel!.sendToQueue(this.queue, buffer, {
      persistent: true,
    });

    if (sent) {
      console.log("Message sent to queue");
    } else {
      console.warn("Message failed to send");
    }
  }

  async close(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
    this.channel = null;
    this.connection = null;
    console.log("🔌 RabbitMQ connection closed");
  }
}

// Export a single instance (Singleton)
export const rabbitMQ = new RabbitMQService();
