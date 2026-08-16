import {
  ExceptionFilter,
  Catch,
  type ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { classifyDatabaseError, recordDbPoolTimeout } from '@nbos/database';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';
    let exceptionDetails: Record<string, unknown> = {};
    let dbCode: string | undefined;

    const classified = classifyDatabaseError(exception);
    if (classified) {
      status = classified.httpStatus;
      message = classified.clientMessage;
      error = classified.code;
      dbCode = classified.code;
      if (classified.code === 'DB_POOL_TIMEOUT') {
        recordDbPoolTimeout();
        this.logger.error('DB_POOL_TIMEOUT');
      } else {
        this.logger.error(
          `${classified.code}: ${exception instanceof Error ? exception.message : 'db error'}`,
        );
      }
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        message = typeof resp['message'] === 'string' ? resp['message'] : message;
        error = typeof resp['error'] === 'string' ? resp['error'] : error;
        exceptionDetails = resp;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    if (status === HttpStatus.INTERNAL_SERVER_ERROR && !classified) {
      this.logger.error(
        exception instanceof Error ? (exception.stack ?? exception.message) : 'Unhandled exception',
      );
    }

    if (status === HttpStatus.INTERNAL_SERVER_ERROR && process.env.NODE_ENV === 'production') {
      message = 'Internal server error';
      error = 'Internal Server Error';
      exceptionDetails = {};
    }

    const body: Record<string, unknown> = {
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
    };

    if (dbCode) {
      body.code = dbCode;
    }

    for (const key of ['code', 'errors', 'blockers', 'details', 'conflicts']) {
      if (exceptionDetails[key] !== undefined && body[key] === undefined) {
        body[key] = exceptionDetails[key];
      }
    }

    response.status(status).json(body);
  }
}
