import {
  All,
  Controller,
  HttpException,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AmqpService } from './amqp/amqp.service';
import { Request, Response } from 'express';
import { match } from 'path-to-regexp';
import { DEFAULT_TIMEOUT } from './constants';
import * as jmespath from 'jmespath';

@Controller('*')
export class AppController {
  private routeConfig: any;

  constructor(
    private readonly configService: ConfigService,
    private readonly amqpService: AmqpService,
  ) {
    this.routeConfig = this.configService.get('routes') || {};
  }

  // Find the correct AMQP route from the config file based on the HTTP request
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


  private applyInputMapping(mapping: Record<string, string>, sources: { body: any; query: any; params: any }) {
    const result: Record<string, any> = {};

    for (const [key, expression] of Object.entries(mapping)) {
      let sourceKey = 'body';
      if (expression.startsWith('query.')) sourceKey = 'query';
      if (expression.startsWith('params.')) sourceKey = 'params';

      const jmes = expression.replace(/^(body|query|params)\./, '');
      const source = sources[sourceKey];
      result[key] = jmespath.search(source, jmes);
    }

    return result;
  }


  // Handle all incoming HTTP requests
  private async handleHttp(req: Request, res: Response) {
    const method = req.method.toLowerCase();
    const path = req.path;

    const config:any = (this.findRoute(path, method) as any).config;

    if (!config) {
      throw new HttpException(`No routing config for ${method.toUpperCase()} ${path}`, 404);
    }

    // Map path, query, and body into a single request payload
    let payload;
    if (config.inputMapping) {
      payload = this.applyInputMapping(config.inputMapping, {
        body: req.body,
        query: req.query,
        params: req.params,
      });
    } else {
      payload = { ...req.query, ...req.body, ...req.params };
    }

    const exchange = config.exchange;
    const routingKey = config.routingKey;
    const replyRoutingKey = config.replyRoutingKey;
    const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT;
    const timeoutStatusCode = config.timeoutStatusCode ?? 504;
    const timeoutMessage = config.timeoutMessage ?? 'Request timed out';

    const allRequiredParamsProvided = exchange && routingKey;

    if(!allRequiredParamsProvided) {
      return res.status(500).json({ message: `Incomplete Configuration for route ${method} : ${path}`});
    } else {
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
  }

  @All()
  async all(@Req() req: Request, @Res() res: Response) {
    return this.handleHttp(req, res);
  }
}
