import type { AuthenticatedAgent } from '../auth/agent-authenticator.service';

export interface AgentIdentityProjection {
  agentId: string;
  agentName: string;
  actorType: string;
  credentialKeyId: string;
  channel: string | null;
  correlationId: string | null;
}

/**
 * Identity for `GET /agent/me` and `nbos_get_identity`.
 *
 * Deliberately free of capabilities, grants and scopes. Tool discovery is not
 * authorization (`08-External-Agent-Protocols-REST-and-MCP.md`), so publishing
 * an effective-permission list here would hand a compromised token a ready-made
 * map of what else to try. The agent learns what it may do by attempting an
 * operation and being allowed or denied server-side.
 */
export function toAgentIdentityProjection(agent: AuthenticatedAgent): AgentIdentityProjection {
  return {
    agentId: agent.agentId,
    agentName: agent.agentName,
    actorType: agent.actor.actor.type,
    credentialKeyId: agent.credentialKeyId,
    channel: agent.actor.channel?.source ?? null,
    correlationId: agent.actor.correlationId ?? null,
  };
}
