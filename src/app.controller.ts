import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
  Req,
  Res,
  All,
  HttpException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AmqpService } from './amqp/amqp.service';
import { Request, Response } from 'express';
import { pathToRegexp, match } from 'path-to-regexp';

@Controller('*')
export class AppController {
  private routeConfig: any;

  constructor(
    private readonly configService: ConfigService,
    private readonly amqpService: AmqpService,
  ) {
    this.routeConfig = this.configService.get('routes') || {};
  }


  private findRoute(path: string, method: string) {
    for (const configPath in this.routeConfig) {
      const matcher = match(configPath, { decode: decodeURIComponent });
      const matched = matcher(path);
  
      if (matched) {
        const methodConfig = this.routeConfig[configPath][method.toLowerCase()];
        if (methodConfig) {
          return { config: methodConfig, params: matched.params };
        }
      }
    }
    return null;
  }
  

  private async handleHttp(req: Request, res: Response) {
    const method = req.method.toLowerCase();
    const path = req.path;

    const config:any = (this.findRoute(path, method) as any).config;

    if (!config) {
      throw new HttpException(`No routing config for ${method.toUpperCase()} ${path}`, 404);
    }

    const payload = { ...req.query, ...req.body, ...req.params };

    const exchange = config.exchange;
    const routingKey = config.routingKey;
    const replyRoutingKey = config.replyRoutingKey;
    const timeoutMs = config.timeoutMs ?? 5000;
    const timeoutStatusCode = config.timeoutStatusCode ?? 504;
    const timeoutMessage = config.timeoutMessage ?? 'Request timed out';

    if (replyRoutingKey) {
      try {
        const response = await this.amqpService.publishAndWait(exchange, routingKey, replyRoutingKey, payload, timeoutMs);
        return res.status(200).json(response);
      } catch (error) {
        if (error.message === 'timeout') {
          return res.status(timeoutStatusCode).json({ message: timeoutMessage });
        }
        return res.status(500).json({ message: 'Internal server error' });
      }
    } else {
      await this.amqpService.publishNoWait(routingKey, payload);
      return res.status(200).json({ status: 'OK' });
    }
  }

  @All()
  async all(@Req() req: Request, @Res() res: Response) {
    return this.handleHttp(req, res);
  }
}
