import { actorContextFromMachine, type ActorChannelSource } from '@nbos/shared';
import type { AuthenticatedAgent } from '../modules/ai-platform/auth/agent-authenticator.service';

/** Shared External Agent fixture for protocol and gateway tests. */
export function authenticatedAgentFixture(
  overrides: {
    agentId?: string;
    channel?: ActorChannelSource;
    correlationId?: string | null;
  } = {},
): AuthenticatedAgent {
  const agentId = overrides.agentId ?? 'agent-1';
  return {
    agentId,
    agentName: 'Cursor Agent',
    agentState: 'ACTIVE',
    credentialId: 'cred-1',
    credentialKeyId: 'aabbccddeeff001122',
    credentialState: 'ACTIVE',
    actor: actorContextFromMachine(
      { id: agentId, type: 'EXTERNAL_AGENT', displayName: 'Cursor Agent' },
      {
        channel: { source: overrides.channel ?? 'rest', protocol: null },
        correlationId: overrides.correlationId ?? 'corr-1',
        client: { ipAddress: null, userAgent: null, credentialId: 'aabbccddeeff001122' },
      },
    ),
  };
}
