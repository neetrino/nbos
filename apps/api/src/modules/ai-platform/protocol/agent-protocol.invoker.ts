import { Injectable } from '@nestjs/common';
import { getAiCapability } from '@nbos/shared';
import { AgentAccessException } from '../auth/agent-auth.errors';
import type { AuthenticatedAgent } from '../auth/agent-authenticator.service';
import { AgentCapabilityGateway } from '../gateway/agent-capability.gateway';
import { AgentRateLimitService } from '../limits/agent-rate-limit.service';
import { decodeAgentArtifactContent } from './agent-artifact-content';
import { toAgentIdentityProjection } from './agent-identity.projection';
import {
  getAgentOperation,
  type AgentOperationDefinition,
  type AgentOperationId,
} from './agent-operation.registry';
import { toAgentResponseBody, type AgentResponseBody } from './agent-response.envelope';

export interface AgentProtocolInvocation {
  agent: AuthenticatedAgent;
  operationId: AgentOperationId;
  input: Record<string, unknown>;
  /** REST `Idempotency-Key` header or MCP `clientOperationId` tool argument. */
  idempotencyKey?: string | null;
  /** Base64 artifact content. Only `artifacts.attach` accepts it. */
  contentBase64?: unknown;
}

/**
 * The one execution path shared by the REST controllers and the MCP server.
 *
 * Adapters translate their transport into an operation id plus JSON input and
 * stop there. Everything after this point — policy, capability, domain action,
 * audit, idempotency — belongs to `AgentCapabilityGateway`. Because both
 * protocols funnel through here, they cannot drift into different
 * authorization outcomes, and neither can reach Prisma or Tasks/Drive directly.
 */
@Injectable()
export class AgentProtocolInvoker {
  constructor(
    private readonly gateway: AgentCapabilityGateway,
    private readonly limits: AgentRateLimitService,
  ) {}

  async invoke(invocation: AgentProtocolInvocation): Promise<AgentResponseBody> {
    const operation = getAgentOperation(invocation.operationId);
    if (!operation.capabilityKey) {
      return toAgentResponseBody(toAgentIdentityProjection(invocation.agent));
    }
    this.consumeCapabilityBudget(invocation.agent.agentId, operation);
    const agentId = invocation.agent.agentId;
    const slot = this.limits.acquireSlot(agentId);
    if (!slot.allowed) {
      throw AgentAccessException.rateLimited(slot.retryAfterSeconds);
    }
    try {
      const result = await this.gateway.invoke({
        agent: invocation.agent,
        capabilityKey: operation.capabilityKey,
        input: compactInput(invocation.input),
        idempotencyKey: invocation.idempotencyKey ?? null,
        payload: operation.acceptsBinaryContent
          ? { bytes: decodeAgentArtifactContent(invocation.contentBase64) }
          : null,
      });
      return toAgentResponseBody(result.data);
    } finally {
      this.limits.releaseSlot(agentId);
    }
  }

  /**
   * Charged here rather than in the guard because one MCP HTTP request can
   * carry several `tools/call` messages: metering the capability at the shared
   * invocation point is what makes the REST and MCP budgets identical
   * (checklist U 325).
   */
  private consumeCapabilityBudget(agentId: string, operation: AgentOperationDefinition): void {
    const capability = operation.capabilityKey
      ? getAiCapability(operation.capabilityKey)
      : undefined;
    // An unknown key is the gateway's decision to make; it answers with a deny
    // reason rather than a rate-limit code.
    if (!capability) return;
    const decision = this.limits.consumeCapability(agentId, capability.rateLimitClass);
    if (!decision.allowed) {
      throw AgentAccessException.rateLimited(decision.retryAfterSeconds);
    }
  }
}

/**
 * Drops absent values so an omitted query parameter is not presented to the
 * capability allowlist as an explicit `undefined` field.
 */
function compactInput(input: Record<string, unknown>): Record<string, unknown> {
  const compacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      compacted[key] = value;
    }
  }
  return compacted;
}
