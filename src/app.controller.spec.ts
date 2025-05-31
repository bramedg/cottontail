import { ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AmqpService } from 'src/amqp/amqp.service';
import { TestBed } from '@suites/unit';
import { RouteConfigService } from './route-config/route-config.service';
import { RouteConfigLoaderService } from './route-config/route-config-loader-service';
jest.mock('src/amqp/amqp.service');
jest.mock('@nestjs/config');

describe('AppController', () => {

    let configService: any = new ConfigService();
    let amqpService: any = new AmqpService();
    let appController!: AppController;

    let req: Request;
    let res: Response;

    beforeEach(async () => {
        req = {} as Request;
        res = {} as Response;

        const { unit, unitRef } = await TestBed.sociable(AppController)
            .expose(RouteConfigService)
            .expose(RouteConfigLoaderService)
            .mock(AmqpService).final({
                publishAndWait: jest.fn().mockResolvedValue({ status: 200, data: 'test' }),
                publishNoWait: jest.fn(),
                listen: jest.fn(),
            })
            .compile();

        appController = unit;

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