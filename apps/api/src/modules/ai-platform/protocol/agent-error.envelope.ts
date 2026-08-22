import { HttpException } from '@nestjs/common';
import type { AiAgentErrorCode } from '@nbos/shared';
import { AgentAccessException } from '../auth/agent-auth.errors';

export interface AgentErrorBody {
  error: {
    code: AiAgentErrorCode;
    message: string;
    requestId: string;
    /**
     * Additive field, present only on `AGENT_RATE_LIMITED`. Every other code
     * keeps the exact `09` §7 shape.
     */
    retryAfterSeconds?: number;
  };
}

export interface AgentErrorResponse {
  status: number;
  body: AgentErrorBody;
}

const HTTP_BAD_REQUEST = 400;
const HTTP_UNAUTHORIZED = 401;
const HTTP_FORBIDDEN = 403;
const HTTP_NOT_FOUND = 404;
const HTTP_METHOD_NOT_ALLOWED = 405;
const HTTP_CONFLICT = 409;
const HTTP_PAYLOAD_TOO_LARGE = 413;
const HTTP_TOO_MANY_REQUESTS = 429;
const HTTP_INTERNAL_ERROR = 500;

/**
 * Safe replacement text for every code.
 *
 * Only `AgentAccessException` is trusted to phrase its own message: it is built
 * from the canon error tables and from deliberate validation feedback. Any
 * other exception (employee guard, Prisma, framework) is re-phrased so internal
 * wording such as "Employee not found" can never reach a machine client.
 */
const CANONICAL_MESSAGES: Record<AiAgentErrorCode, string> = {
  AGENT_AUTH_INVALID: 'Authentication failed.',
  AGENT_CREDENTIAL_REVOKED: 'This credential has been revoked.',
  AGENT_CREDENTIAL_EXPIRED: 'This credential has expired.',
  AGENT_DISABLED: 'This agent is disabled.',
  AGENT_CAPABILITY_DENIED: 'The requested operation is not available to this agent.',
  AGENT_SCOPE_DENIED: 'The requested operation is not available to this agent.',
  AGENT_APPROVAL_REQUIRED: 'This operation requires human approval.',
  AGENT_RESOURCE_NOT_AVAILABLE: 'The requested resource is not available to this agent.',
  AGENT_VALIDATION_FAILED: 'The request is invalid.',
  AGENT_CONFLICT: 'The request conflicts with the current resource state.',
  AGENT_IDEMPOTENCY_CONFLICT: 'The idempotency key was reused with a different payload.',
  AGENT_RATE_LIMITED: 'Rate limit exceeded for this agent credential.',
  AGENT_PROVIDER_UNAVAILABLE: 'The upstream provider is unavailable.',
  AGENT_INTERNAL_ERROR: 'An unexpected error occurred.',
};

const STATUS_TO_CODE: ReadonlyMap<number, AiAgentErrorCode> = new Map<number, AiAgentErrorCode>([
  [HTTP_BAD_REQUEST, 'AGENT_VALIDATION_FAILED'],
  [HTTP_UNAUTHORIZED, 'AGENT_AUTH_INVALID'],
  [HTTP_FORBIDDEN, 'AGENT_CAPABILITY_DENIED'],
  [HTTP_NOT_FOUND, 'AGENT_RESOURCE_NOT_AVAILABLE'],
  [HTTP_METHOD_NOT_ALLOWED, 'AGENT_VALIDATION_FAILED'],
  [HTTP_CONFLICT, 'AGENT_CONFLICT'],
  [HTTP_PAYLOAD_TOO_LARGE, 'AGENT_VALIDATION_FAILED'],
  [HTTP_TOO_MANY_REQUESTS, 'AGENT_RATE_LIMITED'],
]);

/**
 * Renders any failure as the `09` contract envelope.
 *
 * The status/code pair is identical for a missing and for an unauthorized
 * resource, so the transport cannot be used as an existence oracle.
 */
export function toAgentErrorResponse(error: unknown, requestId: string): AgentErrorResponse {
  if (error instanceof AgentAccessException) {
    return {
      status: error.getStatus(),
      body: {
        error: {
          code: error.code,
          message: error.message,
          requestId,
          ...(error.retryAfterSeconds === null
            ? {}
            : { retryAfterSeconds: error.retryAfterSeconds }),
        },
      },
    };
  }
  if (error instanceof HttpException) {
    const status = error.getStatus();
    const code = STATUS_TO_CODE.get(status) ?? 'AGENT_INTERNAL_ERROR';
    return { status: statusForCode(status, code), body: buildBody(code, requestId) };
  }
  return { status: HTTP_INTERNAL_ERROR, body: buildBody('AGENT_INTERNAL_ERROR', requestId) };
}

function statusForCode(status: number, code: AiAgentErrorCode): number {
  return code === 'AGENT_INTERNAL_ERROR' ? HTTP_INTERNAL_ERROR : status;
}

function buildBody(code: AiAgentErrorCode, requestId: string): AgentErrorBody {
  return { error: { code, message: CANONICAL_MESSAGES[code], requestId } };
}
