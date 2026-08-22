import { HttpException } from '@nestjs/common';
import {
  AI_AGENT_APPROVAL_REQUIRED_ERROR,
  AI_AGENT_RESOURCE_NOT_AVAILABLE_ERROR,
  toAgentExternalError,
  type AiAgentErrorCode,
  type AiAgentExternalError,
  type AiPolicyDenyReason,
} from '@nbos/shared';

const HTTP_BAD_REQUEST = 400;
const HTTP_CONFLICT = 409;
const HTTP_PAYLOAD_TOO_LARGE = 413;

/**
 * Machine-readable agent failure. Carries a stable `code` from
 * `09-External-Agent-API-and-MCP-Contract.md` and never includes internal
 * denial detail or record existence hints.
 */
export class AgentAccessException extends HttpException {
  readonly code: AiAgentErrorCode;

  /** Present only on `AGENT_RATE_LIMITED`, so a client can back off exactly. */
  readonly retryAfterSeconds: number | null;

  constructor(error: AiAgentExternalError, retryAfterSeconds: number | null = null) {
    super({ statusCode: error.status, message: error.message, code: error.code }, error.status);
    this.code = error.code;
    this.retryAfterSeconds = retryAfterSeconds;
  }

  static fromDenyReason(reason: AiPolicyDenyReason): AgentAccessException {
    return new AgentAccessException(toAgentExternalError(reason));
  }

  static approvalRequired(): AgentAccessException {
    return new AgentAccessException(AI_AGENT_APPROVAL_REQUIRED_ERROR);
  }

  static resourceNotAvailable(): AgentAccessException {
    return new AgentAccessException(AI_AGENT_RESOURCE_NOT_AVAILABLE_ERROR);
  }

  static validationFailed(message = 'The request is invalid.'): AgentAccessException {
    return new AgentAccessException({
      code: 'AGENT_VALIDATION_FAILED',
      status: HTTP_BAD_REQUEST,
      message,
    });
  }

  static conflict(
    message = 'The request conflicts with the current resource state.',
  ): AgentAccessException {
    return new AgentAccessException({
      code: 'AGENT_CONFLICT',
      status: HTTP_CONFLICT,
      message,
    });
  }

  static idempotencyConflict(): AgentAccessException {
    return new AgentAccessException({
      code: 'AGENT_IDEMPOTENCY_CONFLICT',
      status: HTTP_CONFLICT,
      message: 'The idempotency key was reused with a different payload.',
    });
  }

  /**
   * Abuse-control refusal. `retryAfterSeconds` is the contractual back-off hint
   * echoed both in the body and in the `Retry-After` header.
   */
  static rateLimited(retryAfterSeconds: number): AgentAccessException {
    return new AgentAccessException(toAgentExternalError('RATE_LIMITED'), retryAfterSeconds);
  }

  /**
   * Oversized request. Reported as a validation failure because the `09`
   * contract has no dedicated payload code, while the HTTP status stays 413 so
   * ordinary transport tooling still behaves correctly.
   */
  static payloadTooLarge(message: string): AgentAccessException {
    return new AgentAccessException({
      code: 'AGENT_VALIDATION_FAILED',
      status: HTTP_PAYLOAD_TOO_LARGE,
      message,
    });
  }

  static idempotencyInProgress(): AgentAccessException {
    return new AgentAccessException({
      code: 'AGENT_CONFLICT',
      status: HTTP_CONFLICT,
      message: 'An identical request is already in progress.',
    });
  }
}
