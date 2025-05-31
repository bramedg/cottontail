import { Module } from '@nestjs/common';
import { StreamController } from './stream.controller';
import { AmqpModule } from 'src/amqp/amqp.module';
import { RouteConfigModule } from 'src/route-config/route-config.module';

@Module({
  controllers: [StreamController],
  imports: [AmqpModule, RouteConfigModule],
})
export class StreamModule {}
