import { Catch, Logger, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';
import { AgentAccessException } from '../auth/agent-auth.errors';
import { AGENT_CORRELATION_HEADER, resolveAgentCorrelationId } from './agent-correlation';
import { toAgentErrorResponse } from './agent-error.envelope';
import type { AgentProtocolRequest } from './agent-protocol.request';

const HTTP_INTERNAL_ERROR = 500;

/**
 * Replaces the global `{ statusCode, message, error }` body with the machine
 * envelope from `09-External-Agent-API-and-MCP-Contract.md` §7 for agent routes
 * only. Employee responses are untouched.
 *
 * Bound at controller level so it also covers failures raised by the guards
 * that run for these routes, including a rejected credential.
 */
@Catch()
export class AgentProtocolExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AgentProtocolExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<AgentProtocolRequest>();
    const response = context.getResponse<Response>();
    const requestId = request.agentCorrelationId ?? resolveAgentCorrelationId(null);

    const { status, body } = toAgentErrorResponse(exception, requestId);
    this.logUnexpected(exception, status, requestId);

    if (response.headersSent) {
      response.end();
      return;
    }
    response.setHeader(AGENT_CORRELATION_HEADER, requestId);
    response.status(status).json(body);
  }

  /**
   * Denials are an ordinary outcome and are already audited by policy. Only a
   * genuine fault is logged here, and never the request headers — an
   * `Authorization` value must not reach the log pipeline.
   */
  private logUnexpected(exception: unknown, status: number, requestId: string): void {
    if (exception instanceof AgentAccessException || status < HTTP_INTERNAL_ERROR) return;
    this.logger.error(
      `Agent protocol failure correlationId=${requestId}: ${
        exception instanceof Error ? (exception.stack ?? exception.message) : 'unknown error'
      }`,
    );
  }
}
