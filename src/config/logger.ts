import pino, { type Logger, type LoggerOptions } from 'pino';

const isProduction = process.env.NODE_ENV === 'production';
const logLevel = process.env.LOG_LEVEL ?? (isProduction ? 'info' : 'debug');

/**
 * Default sensitive keys to redact from logs
 */
const defaultRedactKeys = [
  'password',
  '*.password',
  'token',
  '*.token',
  'accessToken',
  '*.accessToken',
  'refreshToken',
  '*.refreshToken',
  'authorization',
  'headers.authorization',
  'cookie',
  'headers.cookie',
  'secret',
  'customerSsn',
];

/**
 * Create transport configuration based on environment
 */
const createTransport = () => {
  const logFilePath = process.env.LOG_FILE_PATH;

  if (!isProduction) {
    const targets: pino.TransportTargetOptions[] = [
      {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
          ignore: 'pid,hostname',
        },
        level: logLevel,
      },
    ];

    if (logFilePath) {
      targets.push({
        target: 'pino/file',
        options: { destination: logFilePath, mkdir: true },
        level: logLevel,
      });
    }

    return pino.transport({ targets });
  }

  if (logFilePath) {
    return pino.transport({
      targets: [
        {
          target: 'pino/file',
          options: { destination: logFilePath, mkdir: true },
          level: logLevel,
        },
      ],
    });
  }

  return undefined;
};

const baseOptions: LoggerOptions = {
  level: logLevel,
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: defaultRedactKeys,
    censor: '[Redacted]',
  },
  base: isProduction
    ? {
        env: process.env.NODE_ENV,
        service: process.env.APP_NAME || 'elysia-starter-kit-api',
      }
    : undefined,
};

const transport = createTransport();

/**
 * Root Pino logger instance
 */
export const logger: Logger = transport
  ? pino(baseOptions, transport)
  : pino(baseOptions);

/**
 * Create a child logger scoped to a specific module/service
 * Example:
 *   const log = createScopedLogger('UserUseCase');
 *   log.info({ userId }, 'User retrieved');
 */
export const createScopedLogger = (
  moduleName: string,
  bindings?: Record<string, unknown>,
): Logger => {
  return logger.child({
    module: moduleName,
    ...bindings,
  });
};

export type { Logger };
export default logger;
