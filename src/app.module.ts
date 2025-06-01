import { Module } from '@nestjs/common';
import { StreamModule } from './stream/stream.module';
import { RpcModule } from './rpc/rpc.module';

@Module({
  imports: [
    StreamModule,
    RpcModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
