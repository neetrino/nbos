import type { AuthenticatedAgent } from '../auth/agent-authenticator.service';

/**
 * Express request as seen by the agent protocol layer.
 *
 * `agent` is written by `AgentAuthGuard`; `user` is deliberately absent, so an
 * External Agent can never be mistaken for an Employee by RBAC guards.
 */
export interface AgentProtocolRequest {
  headers: Record<string, string | string[] | undefined>;
  agent?: AuthenticatedAgent;
  agentCorrelationId?: string;
}

export function requireAuthenticatedAgent(request: AgentProtocolRequest): AuthenticatedAgent {
  const agent = request.agent;
  if (!agent) {
    throw new Error('AgentAuthGuard must run before an agent protocol handler');
  }
  return agent;
}
