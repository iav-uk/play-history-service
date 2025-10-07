// src/utils/logger.ts

import pino, { type LoggerOptions } from 'pino';

const isDocker =
  process.env.DOCKER_ENV === 'true' || (process.env.HOSTNAME || '').includes('docker');
const isTest = process.env.NODE_ENV === 'test';
const isDev = process.env.NODE_ENV === 'development';

const options: LoggerOptions = {
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),

  // fix: only assign base if not test (avoid undefined)
  base: isTest ? null : {},

  redact: {
    paths: ['req.headers.authorization', 'req.body.password'],
    remove: true,
  },
};

// conditionally add pretty transport (without |undefined)
if (!isDocker && !isTest) {
  (options as any).transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  };
}

export const logger = pino(options);
