import amqplib from 'amqplib';
import { buildDealText } from '../utils/dealTextBuilder.js';
import { embeddingService } from './embeddingService.js';

let connection: any = null;
let channel: any = null;

export async function initRabbitMQSubscriber() {
  try {
    connection = await amqplib.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    channel = await connection.createChannel();
    
    // Declare exchange and queue
    await channel.assertExchange('deals.events', 'direct', { durable: true });
    await channel.assertQueue('deals.events.queue', { durable: true });
    await channel.bindQueue('deals.events.queue', 'deals.events', 'deal_created');
    
    console.log('RabbitMQ subscriber listening on deals.events.queue');
    
    // Consume messages
    channel.consume('deals.events.queue', async (msg: any) => {
      if (msg) {
        try {
          const payload = JSON.parse(msg.content.toString());
          
          if (payload.eventType === 'deal_created') {
            const { dealId, dealData, brandId } = payload;
            
            // Build text
            const brand = { name: dealData.brandName || 'Unknown' };
            const text = buildDealText(dealData, brand);
            
            // Generate and store embedding
            await embeddingService.embedAndStore(dealId, text);
            
            // Acknowledge message
            channel.ack(msg);
            console.log(`✓ Embedded deal ${dealId}`);
          }
        } catch (err) {
          console.error('Error processing deal event:', err);
          channel.nack(msg); // Reject and requeue
        }
      }
    }, { noAck: false });
  } catch (err) {
    console.error('Failed to init RabbitMQ subscriber:', err);
    throw err;
  }
}

export async function closeSubscriber() {
  if (channel) await channel.close();
  if (connection) await connection.close();
}