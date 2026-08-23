import { Injectable } from '@nestjs/common';
import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import type { Response } from 'express';
import { tap, type Observable } from 'rxjs';
import { AGENT_CORRELATION_HEADER } from './agent-correlation';
import type { AgentProtocolRequest } from './agent-protocol.request';

/**
 * Echoes the correlation id of a successful agent call. Failures get the same
 * header from `AgentProtocolExceptionFilter`, so a client can quote one id for
 * any outcome (`09-External-Agent-API-and-MCP-Contract.md` §16).
 */
@Injectable()
export class AgentCorrelationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const correlationId = http.getRequest<AgentProtocolRequest>().agentCorrelationId;
    return next.handle().pipe(
      tap(() => {
        const response = http.getResponse<Response>();
        // A handler that owns its own response (the MCP endpoint) has already
        // written the header and flushed the body.
        if (correlationId && !response.headersSent) {
          response.setHeader(AGENT_CORRELATION_HEADER, correlationId);
        }
      }),
    );
  }
}
