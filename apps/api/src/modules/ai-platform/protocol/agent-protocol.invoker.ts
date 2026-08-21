import { Injectable } from '@nestjs/common';
import type { AuthenticatedAgent } from '../auth/agent-authenticator.service';
import { AgentCapabilityGateway } from '../gateway/agent-capability.gateway';
import { decodeAgentArtifactContent } from './agent-artifact-content';
import { toAgentIdentityProjection } from './agent-identity.projection';
import { getAgentOperation, type AgentOperationId } from './agent-operation.registry';
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
  constructor(private readonly gateway: AgentCapabilityGateway) {}

  async invoke(invocation: AgentProtocolInvocation): Promise<AgentResponseBody> {
    const operation = getAgentOperation(invocation.operationId);
    if (!operation.capabilityKey) {
      return toAgentResponseBody(toAgentIdentityProjection(invocation.agent));
    }
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
