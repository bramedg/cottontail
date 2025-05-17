import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AmqpService } from './amqp/amqp.service';
import * as yaml from 'js-yaml';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as _ from 'lodash';
import { CONFIG_FILE_SOURCE } from './constants';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        () => yaml.load(readFileSync(CONFIG_FILE_SOURCE))
      ],
    }),
  ],
  controllers: [AppController],
  providers: [AmqpService],
})
export class AppModule {}
