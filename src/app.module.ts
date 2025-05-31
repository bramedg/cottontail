import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AmqpService } from './amqp/amqp.service';
import { StreamModule } from './stream/stream.module';
import { AmqpModule } from './amqp/amqp.module';
import { RouteConfigModule } from './route-config/route-config.module';

@Module({
  imports: [
    StreamModule,
    AmqpModule,
    RouteConfigModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
