import { Module } from '@nestjs/common';
import { RpcController } from 'src/rpc/rpc.controller';
import { RpcService } from 'src/rpc/rpc.service';
import { RouteConfigModule } from 'src/route-config/route-config.module';
import { AmqpModule } from 'src/amqp/amqp.module';

@Module({
  controllers: [RpcController],
  providers: [RpcService],
  imports: [RouteConfigModule, AmqpModule]
})
export class RpcModule {}
