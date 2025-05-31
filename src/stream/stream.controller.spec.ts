import { Test, TestingModule } from '@nestjs/testing';
import { StreamController } from './stream.controller';
import { RouteConfigModule } from 'src/route-config/route-config.module';
import { AmqpService } from 'src/amqp/amqp.service';
import { AmqpServiceMock } from 'src/amqp/amqp.service.mock';
import { AmqpModule } from 'src/amqp/amqp.module';
import { join } from 'path';
import * as _ from 'lodash';

describe('StreamController', () => {
  let controller: StreamController;

  beforeEach(async () => {

     const module: TestingModule = await Test.createTestingModule({
      controllers: [StreamController],
      imports: [RouteConfigModule],
      providers: [AmqpService]
      })
      .overrideProvider(AmqpService).useClass(AmqpServiceMock).compile();

    controller = module.get<StreamController>(StreamController);


  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

});
