import {
  ExceptionFilter,
  Catch,
  type ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';
    let exceptionDetails: Record<string, unknown> = {};

    if (exception instanceof HttpException) {
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

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      console.error('Unhandled exception:', exception);
    }

    const body: Record<string, unknown> = {
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
    };

    for (const key of ['code', 'errors', 'blockers', 'details']) {
      if (exceptionDetails[key] !== undefined) {
        body[key] = exceptionDetails[key];
      }
    }

    response.status(status).json(body);
  }
}
