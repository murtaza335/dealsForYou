import amqp, {Channel, ChannelModel, Connection} from "amqplib";
import { DealRepository } from "../repositories/deal.repository.js";

class RabbitMQSubscriber {
    private connection: ChannelModel | null = null;
    private channel: Channel | null = null;
    private readonly queue = "scraper_deals_queue";

    dealRepo = new DealRepository();
    constructor() {}

    async init() {
        try {
            this.connection = await amqp.connect("amqp://localhost:5672");
            this.channel = await this.connection.createChannel();
            
            await this.channel.assertQueue(this.queue, { durable: true });

            // 1. Prefetch: Don't give this worker more than 1 message at a time
            // This prevents one worker from getting overloaded while others are idle
            this.channel.prefetch(1);

            console.log(`📥 Waiting for messages in ${this.queue}...`);

            // 2. Start consuming
            this.channel.consume(this.queue, (msg) => {
                if (msg !== null) {
                    this.handleMessage(msg);
                }
            });
        } catch (error) {
            console.error("❌ Subscriber Error:", error);
        }
    }

    async handleMessage(msg : amqp.ConsumeMessage) {
        console.log(msg.content)
        const content = JSON.parse(msg.content.toString());
        
        try {
            console.log("🚀 Processing Deal:", content);
            
            // make the object for sending to the function
            const brandInfo = {
                name: content.brand,
                slug: content.slug,
                baseUrl: content.url
            }
            // here we will be sending the data to the database and then we will be acknowledging the message
            // first extracting and saving the brand


            const brand = await this.dealRepo.createOrGetBrand(brandInfo);
            // then syncing the deals for that brand
            await this.dealRepo.syncDealsForBrand(brand._id.toString(), content.deals);

            
            // 3. Acknowledge: Tell RabbitMQ the message is processed and can be deleted
            if (this.channel) {
                this.channel.ack(msg);
            }
        } catch (error) {
            console.error("⚠️ Failed to process message:", error);
            
            // 4. Negative Ack: Put the message back in the queue if it failed
            // Set requeue: true to try again, or false to discard/send to DLX
            if (this.channel) {
                this.channel.nack(msg, false, true);
            }
        }
    }
}

export const rabbitMQSubscriber = new RabbitMQSubscriber();