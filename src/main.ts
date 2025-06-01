import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PORT, CONFIG_FILE_SOURCE } from './constants';
import { ConsoleLogger, Logger } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({
      prefix: 'Cottontail',
      timestamp: true,
      logLevels: ['error', 'warn', 'log', 'debug', 'verbose'],
    }),
  });

  app.enableCors();
  app.use(cookieParser());

  if(!CONFIG_FILE_SOURCE) {
    Logger.error('Configuration file note found.  Please set the COTTONTAIL_CONFIG environment variable or pass a config file as an argument.');
    process.exit(1);
  }

  await app.listen(PORT);
}
bootstrap();
