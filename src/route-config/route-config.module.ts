import { Module } from '@nestjs/common';
import { RouteConfigService } from './route-config.service';
import { RouteConfigLoaderService } from './route-config-loader-service';

@Module({
  providers: [RouteConfigService, RouteConfigLoaderService],
  exports: [RouteConfigService],
})
export class RouteConfigModule { }
