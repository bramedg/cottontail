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
import * as jmespath from 'jmespath';

import { DEFAULT_TIMEOUT, JWT_SECRET } from './constants';

import * as jsonwebtoken from 'jsonwebtoken';
import * as _ from 'lodash';
import { RouteConfigService } from './route-config/route-config.service';

@Controller('*')
export class AppController {
  private routeConfig: any;

  constructor(private readonly amqpService: AmqpService, private readonly routeConfigService: RouteConfigService) {}

  private applyInputMapping(mapping: Record<string, string>, sources: { body: any; query: any; params: any; jwt: any }) {
    const result: Record<string, any> = {};

    for (const [key, expression] of Object.entries(mapping)) {
      let sourceKey = 'body';
      if (expression.startsWith('query.')) sourceKey = 'query';
      if (expression.startsWith('params.')) sourceKey = 'params';
      if (expression.startsWith('jwt.')) sourceKey = 'jwt';

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
    const bearerToken = _.get(req, 'headers.authorization', '').split(' ')[1];
    let decodedJwt = {};
    let methodConfig;

    try {
      methodConfig = this.routeConfigService.findMethodConfig(path, method);
    } catch (error) {
      return res.status(404).json({ message: error.message });
    }

    const { config, params } = methodConfig;

    try {
      decodedJwt = this.routeConfigService.validateRouteAuthorization(config, bearerToken);
    } catch (error) {
      return res.status(403).json({ message: error.message });
    }

    const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT;
    const timeoutStatusCode = config.timeoutStatusCode ?? 504;
    const timeoutMessage = config.timeoutMessage ?? 'Request timed out';
    const isRpc = config.rpc || false;
    const exchange = config.exchange;
    const routingKey = config.routingKey;

    // Map path, query, and body into a single request payload
    let mappedHeaders = {};
    let mappedProperties = {};
    let mappedPayload = {};
    if (config.inputMapping) {

      const inputMappingHeaders = _.get(config, 'inputMapping.headers', {});
      const inputMappingProperties = _.get(config, 'inputMapping.properties', {});

      mappedHeaders = this.applyInputMapping(inputMappingHeaders, {
        body: req.body,
        query: req.query,
        params: params,
        jwt: decodedJwt
      });
      
      mappedProperties = this.applyInputMapping(inputMappingProperties, {
        body: req.body,
        query: req.query,
        params: params,
        jwt: decodedJwt
      });

      mappedPayload = this.applyInputMapping(_.omit(config.inputMapping, ['headers','properties']), {
        body: req.body,
        query: req.query,
        params: params,
        jwt: decodedJwt
      });
    } else {
      mappedPayload = { ...req.query, ...req.body, ...params, ...decodedJwt };
    }

    const allRequiredParamsProvided = exchange && routingKey;

    if(!allRequiredParamsProvided) {
      return res.status(500).json({ message: `Incomplete Configuration for route ${method} : ${path}`});
    } else {
      if (routingKey && isRpc) {
        try {
          const response = await this.amqpService.publishAndWait(exchange, routingKey, mappedPayload, mappedHeaders, mappedProperties, timeoutMs);
          return res.status(200).json(response);
        } catch (error) {
          if (error.message === 'timeout') {
            return res.status(timeoutStatusCode).json({ message: timeoutMessage });
          }
          return res.status(500).json({ message: 'Internal server error' });
        }
      } else if (routingKey) {
        await this.amqpService.publishNoWait(exchange, routingKey, mappedPayload, mappedHeaders, mappedProperties);
        return res.status(200).json({ status: 'OK' });
      } else {
        return res.status(500).json({ message: `Routing key not provided for ${method} : ${path}` });
      }

    }
  }

  @All()
  async all(@Req() req: Request, @Res() res: Response) {
    return this.handleHttp(req, res);
  }
}
