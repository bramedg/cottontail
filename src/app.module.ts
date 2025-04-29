import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AmqpService } from './amqp/amqp.service';
import * as yaml from 'js-yaml';
import { readFileSync } from 'fs';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        () => yaml.load(readFileSync(join(process.cwd(), 'config.yml'))
        ) as Record<string, any>,
      ],
    }),
  ],
  controllers: [AppController],
  providers: [AmqpService],
})
export class AppModule {}
