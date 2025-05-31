import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import { CONFIG_FILE_SOURCE, TEST_MODE } from 'src/constants';
import { join } from 'path';

@Injectable()
export class RouteConfigLoaderService {
 
  private routeConfigs: Record<string, any> = {};

  constructor() {}

  public getRoutes(): any {

    const filePath = TEST_MODE ? join(process.cwd(), 'mock.config.yml') : CONFIG_FILE_SOURCE;

    this.routeConfigs = yaml.load(readFileSync(filePath));
    return this.routeConfigs.routes;
  }

}
