import { Test, TestingModule } from '@nestjs/testing';
import { AmqpService } from './amqp.service';

describe('AmqpService', () => {
  let service: AmqpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AmqpService],
    }).compile();

    service = module.get<AmqpService>(AmqpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
