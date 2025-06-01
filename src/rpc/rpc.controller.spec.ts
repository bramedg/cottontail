import { ConfigService } from '@nestjs/config';
import { AmqpService } from 'src/amqp/amqp.service';
import { TestBed } from '@suites/unit';
import { RouteConfigService } from 'src/route-config/route-config.service';
import { RouteConfigLoaderService } from 'src/route-config/route-config-loader-service';
import { RpcController } from './rpc.controller';
jest.mock('src/amqp/amqp.service');
jest.mock('@nestjs/config');

describe('rpcController', () => {

    let configService: any = new ConfigService();
    let amqpService: any = new AmqpService();
    let rpcController!: RpcController;

    let req: Request;
    let res: Response;

    beforeEach(async () => {
        req = {} as Request;
        res = {} as Response;

        const { unit, unitRef } = await TestBed.sociable(RpcController)
            .expose(RouteConfigService)
            .expose(RouteConfigLoaderService)
            .mock(AmqpService).final({
                publishAndWait: jest.fn().mockResolvedValue({ status: 200, data: 'test' }),
                publishNoWait: jest.fn(),
                listen: jest.fn(),
            })
            .compile();

        rpcController = unit;

    })

    afterEach(() => {
        jest.restoreAllMocks();
    })

    it('should be defined', () => {
        expect(rpcController).toBeDefined();
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


        return rpcController.all(request, response).then((route: any) => {
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


        return rpcController.all(request, response).then((route: any) => {
            expect(response.json).toHaveBeenCalledWith({
                status: "OK"
            });
        });
    });

});