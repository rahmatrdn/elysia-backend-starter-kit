import { Elysia } from 'elysia';
import { AppError } from '@/common/errors/app-error';
import { logger } from '@/common/logger';
import { jsonError } from '@/internal/presenter/json';

export const errorHandlerPlugin = new Elysia({ name: 'error-handler' }).onError(
  { as: 'global' },
  ({ code, error, set }) => {
    // 1. Handle custom AppError (ConflictError, NotFoundError, BadRequestError, etc.)
    if (error instanceof AppError) {
      // Error 500 / server-side error: sembunyikan detail teknis dari respon client
      if (error.statusCode >= 500) {
        logger.error(
          {
            err: error,
            details: error.details,
            statusCode: error.statusCode,
          },
          `[Server Error]: ${error.message}`,
        );

        return jsonError({
          set,
          statusCode: 500,
          message:
            'Something went wrong. Please try again. If the issue persists, contact our support team for assistance.',
        });
      }

      return jsonError({
        set,
        statusCode: error.statusCode,
        message: error.message,
        ...(error.details ? { error: error.details } : {}),
      });
    }

    // 2. Handle Elysia / TypeBox Validation Errors
    if (code === 'VALIDATION') {
      const details = error.all
        ? error.all.map((err: any) => ({
            path: err.path,
            message: err.schema?.error || err.summary || err.message,
          }))
        : (error as any).customError || error.message;

      return jsonError({
        set,
        statusCode: 400,
        message: 'Validation failed',
        error: details,
      });
    }

    // 3. Handle Route Not Found Errors
    if (code === 'NOT_FOUND') {
      return jsonError({
        set,
        statusCode: 404,
        message: 'Route not found',
      });
    }

    // 4. Handle Unhandled Internal Server Errors
    logger.error({ err: error }, '[Unhandled Server Error]');
    return jsonError({
      set,
      statusCode: 500,
      message: 'Internal server error',
    });
  },
);
