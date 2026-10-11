import { logixlysia, type Options } from 'logixlysia';

const isProduction = process.env.NODE_ENV === 'production';

export const devLoggerConfig: Options = {
  preset: 'json',
  config: {
    showStartupMessage: true,
    startupMessageFormat: 'banner',
    ip: true,
    logQueryParams: true,
    logFilePath: './storage/logs/app.log',
    logRotation: {
      maxSize: '100m',
      interval: '1d',
      maxFiles: '30d',
      compress: true,
    },
    requestId: true,
  },
};

export const prodLoggerConfig: Options = {
  preset: 'prod',
  config: {
    showStartupMessage: true,
    startupMessageFormat: 'banner',
    ip: true,
    logQueryParams: true,
    logFilePath: './storage/logs/app.log',
    logRotation: {
      maxSize: '100m',
      interval: '1d',
      maxFiles: '30d',
      compress: true,
    },
    logFilter: {
      level: ['ERROR', 'WARNING'],
    },
    autoRedact: true,
    redactKeys: ['customerSsn'],
    requestId: true,
  },
};

export const loggerConfig: Options = isProduction
  ? prodLoggerConfig
  : devLoggerConfig;

export const httpLogger = logixlysia(loggerConfig);
