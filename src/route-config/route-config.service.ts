import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { match } from 'path-to-regexp';
import * as jmespath from 'jmespath';
import * as _ from 'lodash';
import * as jsonwebtoken from 'jsonwebtoken';
import { DEBUG_MODE, JWT_SECRET } from 'src/constants';
import { RouteConfigLoaderService } from './route-config-loader-service';

@Injectable()
export class RouteConfigService {

    routeConfig: any;

    constructor(private readonly routeConfigLoaderService: RouteConfigLoaderService) {}

    // Find the correct AMQP route from the config file based on the HTTP request
    public findMethodConfig(path: string, method: string) {
        if(!this.routeConfig) {
            this.routeConfig = this.routeConfigLoaderService.getRoutes();
        }

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
        throw new Error(`No routing config found for ${method.toUpperCase()} ${path}`);
    }

    public validateRouteAuthorization(methodConfig: any, bearerToken: string): any {

        const requiredRoles = methodConfig.roles || [];

        let decodedJwt = {};

        let roles: any = [];
        if (bearerToken && requiredRoles.length > 0) {
            decodedJwt = jsonwebtoken.verify(bearerToken, JWT_SECRET, { algorithms: ['HS256'], ignoreExpiration: DEBUG_MODE }) as any;
            if (decodedJwt) {
                try {
                    roles = decodedJwt['roles'].split(',') || [];
                    const requirementsSatisfied = requiredRoles.every(role => roles.includes(role))

                    if (!requirementsSatisfied) {
                        throw Error('Forbidden: Insufficient permissions');
                    }

                    return decodedJwt

                } catch (error) {
                    throw Error('Roles string invalid or not separated by commas.');
                }
            }
        }
    }

}
