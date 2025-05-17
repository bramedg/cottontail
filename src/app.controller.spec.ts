import { ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AmqpService } from 'src/amqp/amqp.service';
import { spyOn } from 'jest-mock';

jest.mock('src/amqp/amqp.service');
jest.mock('@nestjs/config');

describe('AppController', () => {

    let configService: any = new ConfigService();
    let amqpService: any = new AmqpService();
    let appController!: AppController;

    let req: Request;
    let res: Response;

    beforeEach(() => {
        req = {} as Request;
        res = {} as Response;

        jest.spyOn(configService, 'get').mockImplementation((item) => {
            return {
                    '/test_rpc': {
                        get: {
                            rpc: true,
                            exchange: 'test_exchange',
                            routingKey: 'test.routing.key'
                        }
                    },
                    '/test_non_rpc': {
                        get: {
                            exchange: 'test_exchange',
                            routingKey: 'test.routing.key'
                        }
                    },
            }
        });

        jest.spyOn(amqpService, 'publishAndWait').mockImplementation((exchange, routingKey, message, timeoutMs) => {
            return new Promise((resolve) => {
                resolve({status: 200, data: 'test'});
            });
        });

        jest.spyOn(amqpService, 'publishNoWait').mockImplementation((routingKey, message) => {
            return new Promise((resolve) => {
                resolve({status: 200, data: 'test'});
            });
        });

        appController = new AppController(configService, amqpService);

    })

    afterEach(() => {
        jest.restoreAllMocks();
    })

    it('should be defined', () => {
        expect(appController).toBeDefined();
    });

    it('should route correctly for rpc', () => {

        const request: any = {
            method: 'get',
            path: '/test_rpc',
            body: {},
        }

        const response: any = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn(),
            setHeader: jest.fn(),
        } as unknown as Response;


        return appController.all(request, response).then((route: any) => {
            expect(response.json).toHaveBeenCalledWith({
                status: 200,
                data: 'test'
            });
        });
    });

    it('should route correctly for non rpc', () => {

        const request: any = {
            method: 'get',
            path: '/test_non_rpc',
            body: {},
        }

        const response: any = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn(),
            setHeader: jest.fn(),
        } as unknown as Response;


        return appController.all(request, response).then((route: any) => {
            expect(response.json).toHaveBeenCalledWith({
                status: "OK"
            });
        });
    });

});