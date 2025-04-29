import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as amqp from 'amqplib';

@Injectable()
export class AmqpService implements OnModuleInit, OnModuleDestroy {
  private connection: amqp.Connection;
  private channel: amqp.Channel;

  async onModuleInit() {
    this.connection = await amqp.connect('amqp://localhost');
    this.channel = await this.connection.createChannel();
  }

  async onModuleDestroy() {
    await this.channel.close();
    await this.connection.close();
  }

  async publishAndWait(
    exchange: string,
    requestRoutingKey: string,
    responseQueue: string,
    message: any,
    timeoutMs: number,
  ): Promise<any> {
    const corrId = Math.random().toString() + Math.random().toString();

    const responsePromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('timeout'));
      }, timeoutMs);

      this.channel.assertQueue(responseQueue).then(() => {
        this.channel
          .bindQueue(responseQueue, exchange, responseQueue)
          .then(() => {
            this.channel.consume(
              responseQueue,
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

    await this.channel.publish(
      exchange,
      requestRoutingKey,
      Buffer.from(JSON.stringify(message)),
      { correlationId: corrId, replyTo: responseQueue },
    );

    return responsePromise;
  }

  async publishNoWait(requestQueue: string, message: any) {
    await this.channel.sendToQueue(
      requestQueue,
      Buffer.from(JSON.stringify(message)),
    );
  }
}
