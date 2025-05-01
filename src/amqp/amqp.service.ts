import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as amqp from 'amqplib';
import { randomUUID } from 'crypto';
import { APP_ID, AMQP_URL } from 'src/constants';


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

  async publishAndWait(
    exchange: string,
    requestRoutingKey: string,
    responseQueue: string,
    message: any,
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

    // Publish to the supplied exchange, and routing key.  Include the response queue in the replyTo
    await this.channel.publish(
      exchange,
      requestRoutingKey,
      Buffer.from(JSON.stringify(message)),
      { correlationId: corrId, replyTo: responseQueue },
    );

    return responsePromise;
  }

  // Publish without waiting for a reply
  async publishNoWait(requestQueue: string, message: any) {
    await this.channel.sendToQueue(
      requestQueue,
      Buffer.from(JSON.stringify(message)),
    );
  }
}
