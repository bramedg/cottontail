import { join } from "path";
import * as _ from "lodash";

export const APP_ID = "COTTONTAIL";
export const AMQP_URL = process.env['AMQP_URL'] || 'amqp://localhost';
export const PORT = process.env.PORT ?? 3000;
export const DEFAULT_TIMEOUT = 5000;
export const RESPONSE_QUEUE = `${APP_ID}_response`;
export const RESPONSE_ROUTING_KEY = `${APP_ID}.response`;
export const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";
export const TEST_MODE = _.get(process.argv, '1', '').includes('jest');
export const CONFIG_FILE_SOURCE = 
    _.get(process.argv,'2') 
    || process.env.COTTONTAIL_CONFIG 
    || join(process.cwd(), 'config.yml')