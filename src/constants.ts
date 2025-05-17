import { join } from "path";
import * as _ from "lodash";

export const APP_ID = "COTTONTAIL";
export const AMQP_URL = process.env['AMQPURL'] || 'amqp://localhost';
export const PORT = process.env.PORT ?? 3000;
export const DEFAULT_TIMEOUT = 5000;
export const RESPONSE_QUEUE = `${APP_ID}_response`;
export const RESPONSE_ROUTING_KEY = `${APP_ID}.response`;
export const CONFIG_FILE_SOURCE = _.get(process.argv,'2') || process.env.COTTONTAIL_CONFIG || join(process.cwd(), 'config.yml')