import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as amqp from 'amqplib';
import { randomUUID } from 'crypto';
import { APP_ID, AMQP_URL, RESPONSE_QUEUE, RESPONSE_ROUTING_KEY } from 'src/constants';


@Injectable()
export class AmqpService implements OnModuleInit, OnModuleDestroy {
  private connection: amqp.Connection;
  private channel: amqp.Channel;

  async onModuleInit() {
    this.connection = await amqp.connect(AMQP_URL);
    this.channel = await this.connection.createChannel();
  }

  async onModuleDestroy() {
    await this.channel.close();
    await this.connection.close();
  }

  async listen(
    exchange: string,
    routingKey: string,
    callback: (msg: amqp.ConsumeMessage | null) => void,
  ): Promise<void> {
    const queueName = `streams_${routingKey.replaceAll('.', '_')}`;

    // Ensure the exchange exists
    await this.channel.assertExchange(exchange, 'topic', { durable: true });
    // Ensure the queue exists
    const queue = await this.channel.assertQueue(queueName, { exclusive: true });
    // Bind the queue to the exchange with the routing key
    await this.channel.bindQueue(queueName, exchange, routingKey);
    // Start consuming messages from the queue
    await this.channel.consume(queueName, (msg) => {
      if (msg) {
        // Acknowledge the message
        this.channel.ack(msg);
        // Call the provided callback with the message
        callback(msg);
      } else {
        // If the message is null, it means the consumer was cancelled
        console.warn('Consumer cancelled, no message received');
      }
    }, { noAck: false });
  }

  async publishAndWait(
    exchange: string,
    requestRoutingKey: string,
    message: any,
    headers: any,
    properties: any,
    timeoutMs: number,
  ): Promise<any> {
    const uid = randomUUID();
    const corrId = `${APP_ID}-${uid}`

    const responsePromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('timeout'));
      }, timeoutMs);

      // Ensure the listening queue exists, bind to it, and listen for replies.  Only respond to this thread when the
      // correlation id we initiated with is the one on the message coming back
      this.channel.assertQueue(RESPONSE_QUEUE).then(() => {
        this.channel
          .bindQueue(RESPONSE_QUEUE, exchange, RESPONSE_ROUTING_KEY)
          .then(() => {
            this.channel.consume(
              RESPONSE_QUEUE,
              (msg) => {
                if (msg && msg.properties.correlationId === corrId) {
                  clearTimeout(timeout);
                  const content = JSON.parse(msg.content.toString());
                  this.channel.ack(msg);
                  resolve(content);
                } else {
                  this.channel.nack(msg, false, true)
                }
              }
            );
          });
      });
    });

    // Publish to the supplied exchange, and routing key.  Include the response queue in the replyTo
    await this.channel.publish(
      exchange,
      requestRoutingKey,
      Buffer.from(JSON.stringify(message)),
      { correlationId: corrId, replyTo: RESPONSE_ROUTING_KEY, ...properties, headers },
    );

    return responsePromise;
  }

  // Publish without waiting for a reply
  async publishNoWait(exchange: string, requestRoutingKey:string, message: any, headers: any, properties: any) {
    await this.channel.publish(
      exchange,
      requestRoutingKey,
      Buffer.from(JSON.stringify(message)),
    );
  }
}
