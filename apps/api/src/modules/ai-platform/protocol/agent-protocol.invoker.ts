import { Injectable, Optional } from '@nestjs/common';
import { getAiCapability } from '@nbos/shared';
import { AgentAccessException } from '../auth/agent-auth.errors';
import type { AuthenticatedAgent } from '../auth/agent-authenticator.service';
import { AgentCapabilityGateway } from '../gateway/agent-capability.gateway';
import { AgentRateLimitService } from '../limits/agent-rate-limit.service';
import { AiExecutionService } from '../observability/ai-execution.service';
import { AgentPolicyService } from '../policy/agent-policy.service';
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
  idempotencyKey?: string | null;
  contentBase64?: unknown;
}

@Injectable()
export class AgentProtocolInvoker {
  constructor(
    private readonly gateway: AgentCapabilityGateway,
    private readonly limits: AgentRateLimitService,
    @Optional() private readonly policy?: AgentPolicyService,
    @Optional() private readonly executions?: AiExecutionService,
  ) {}

  async invoke(invocation: AgentProtocolInvocation): Promise<AgentResponseBody> {
    const operation = getAgentOperation(invocation.operationId);
    if (!operation.capabilityKey) {
      return toAgentResponseBody(toAgentIdentityProjection(invocation.agent));
    }
    const startedAt = new Date();
    await this.consumeCapabilityBudget(invocation, operation, startedAt);
    const agentId = invocation.agent.agentId;
    const slot = await this.limits.acquireSlot(agentId);
    if (!slot.allowed) {
      this.recordExecution(
        invocation,
        operation.capabilityKey,
        'RATE_LIMITED',
        startedAt,
        'AGENT_RATE_LIMITED',
      );
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
      this.recordExecution(invocation, operation.capabilityKey, 'SUCCEEDED', startedAt, null);
      return toAgentResponseBody(result.data);
    } catch (error) {
      const code = error instanceof AgentAccessException ? error.code : 'AGENT_INTERNAL_ERROR';
      const status = code === 'AGENT_RATE_LIMITED' ? 'RATE_LIMITED' : 'FAILED';
      this.recordExecution(invocation, operation.capabilityKey, status, startedAt, code);
      throw error;
    } finally {
      await this.limits.releaseSlot(agentId);
    }
  }

  private async consumeCapabilityBudget(
    invocation: AgentProtocolInvocation,
    operation: AgentOperationDefinition,
    startedAt: Date,
  ): Promise<void> {
    const capabilityKey = operation.capabilityKey;
    const capability = capabilityKey ? getAiCapability(capabilityKey) : undefined;
    if (!capability || !capabilityKey) return;
    const decision = await this.limits.consumeCapability(
      invocation.agent.agentId,
      capability.rateLimitClass,
    );
    if (decision.allowed) return;
    if (this.policy) {
      await this.policy.evaluate({
        actor: invocation.agent.actor,
        agentState: invocation.agent.agentState,
        credentialState: invocation.agent.credentialState,
        capabilityKey,
        target: {},
        rateLimitExceeded: true,
      });
    }
    this.recordExecution(
      invocation,
      capabilityKey,
      'RATE_LIMITED',
      startedAt,
      'AGENT_RATE_LIMITED',
    );
    throw AgentAccessException.rateLimited(decision.retryAfterSeconds);
  }

  private recordExecution(
    invocation: AgentProtocolInvocation,
    capabilityKey: string,
    status: 'SUCCEEDED' | 'FAILED' | 'RATE_LIMITED',
    startedAt: Date,
    errorCode: string | null,
  ): void {
    if (!this.executions) return;
    const completedAt = new Date();
    void this.executions.record({
      kind: 'CAPABILITY',
      status,
      actor: invocation.agent.actor,
      externalAgentId: invocation.agent.agentId,
      capabilityKey,
      latencyMs: Math.max(0, completedAt.getTime() - startedAt.getTime()),
      errorCode,
      startedAt,
      completedAt,
    });
  }
}

function compactInput(input: Record<string, unknown>): Record<string, unknown> {
  const compacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      compacted[key] = value;
    }
  }
  return compacted;
}
