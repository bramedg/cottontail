import { Injectable } from '@nestjs/common';
import * as amqp from 'amqplib';



@Injectable()
export class AmqpServiceMock {

  async listen(
    exchange: string,
    routingKey: string,
    callback: (msg: amqp.ConsumeMessage | null) => void,
  ): Promise<void> {
    // Do nothing...
  }

  async publishAndWait(
    exchange: string,
    requestRoutingKey: string,
    message: any,
    headers: any,
    properties: any,
    timeoutMs: number,
  ): Promise<any> {
    const responsePromise = Promise.resolve({message: 'Response not implemented in mock'});
    return responsePromise;
  }

  // Publish without waiting for a reply
  async publishNoWait(exchange: string, requestRoutingKey:string, message: any, headers: any, properties: any) {
    // Do nothing...
  }
}
