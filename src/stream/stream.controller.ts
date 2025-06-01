import { Controller, Param, Req, Res } from '@nestjs/common';
import { Body, Post, Sse } from '@nestjs/common';
import * as jsonwebtoken from 'jsonwebtoken';
import { JWT_SECRET } from 'src/constants';
import * as _ from 'lodash';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { AmqpService } from 'src/amqp/amqp.service';
import { RouteConfigService } from 'src/route-config/route-config.service';

@Controller('stream')
export class StreamController {

    constructor(private readonly amqpService: AmqpService, private readonly routeConfigService: RouteConfigService) {}

    @Post('auth/:streamId')
    authenticate(@Req() req: Request, @Res() res: Response, @Param('streamId') streamId: string) {
        const path = `/${streamId}`
        const jwt = _.get(req, 'headers.authorization', '').split(' ')[1];
        let decodedJwt = {};
        let methodConfig;

        try {
            methodConfig = this.routeConfigService.findMethodConfig(path, 'SSE');
        } catch (e) {
            return res.status(404).json({ message: `No route found for ${path}` });
        }

        const { config, params } = methodConfig;
        try {
            const decodedJwt = this.routeConfigService.validateRouteAuthorization(config, jwt);
            return res.cookie('jwt', jwt, {
                httpOnly: true
            }).json({
                message: 'Authenticated successfully',
                streamId: streamId,});
        } catch (e) {
            return res.status(401).json({ message: 'Unauthorized: Invalid JWT token or insufficient roles granted' });
        }
        
    }

    @Sse('listen/:streamId')
    registerStream(@Req() req, @Res() res: Response, @Param('streamId') streamId: string) {
        const path = `/${streamId}`
        const jwt = req.cookies.jwt;
        let decodedJwt = {};
        let methodConfig;

        try {
            methodConfig = this.routeConfigService.findMethodConfig(path, 'SSE');
        } catch (e) {
            return res.status(404).json({ message: `No route found for ${path}` });
        }

        const { config, params } = methodConfig;
        try {
            const decodedJwt = this.routeConfigService.validateRouteAuthorization(config, jwt);
            return new Observable((observer) => {
                this.amqpService.listen(
                    'amq.topic',
                    `${streamId}`,
                    (msg) => {
                        observer.next(msg.content.toString());
                    });
            });
        } catch (e) {
            return res.status(401).json({ message: 'Unauthorized: Invalid JWT token or insufficient roles granted' });
        }

    }
}
