import { HttpException } from '@nestjs/common';
import {
  AI_AGENT_APPROVAL_REQUIRED_ERROR,
  toAgentExternalError,
  type AiAgentErrorCode,
  type AiAgentExternalError,
  type AiPolicyDenyReason,
} from '@nbos/shared';

/**
 * Machine-readable agent failure. Carries a stable `code` from
 * `09-External-Agent-API-and-MCP-Contract.md` and never includes internal
 * denial detail or record existence hints.
 */
export class AgentAccessException extends HttpException {
  readonly code: AiAgentErrorCode;

  constructor(error: AiAgentExternalError) {
    super({ statusCode: error.status, message: error.message, code: error.code }, error.status);
    this.code = error.code;
  }

  static fromDenyReason(reason: AiPolicyDenyReason): AgentAccessException {
    return new AgentAccessException(toAgentExternalError(reason));
  }

  static approvalRequired(): AgentAccessException {
    return new AgentAccessException(AI_AGENT_APPROVAL_REQUIRED_ERROR);
  }
}
