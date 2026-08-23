import { describe, expect, it } from 'vitest';
import type { ExternalAgentBundle } from '@/lib/api/ai-admin';
import { grantableExternalAgents } from './grantable-agents';

function bundle(id: string, state: ExternalAgentBundle['agent']['state']): ExternalAgentBundle {
  return {
    agent: {
      id,
      name: id,
      description: null,
      state,
      ownerId: 'owner',
      createdById: 'owner',
      expiresAt: null,
      revokedAt: null,
      lastUsedAt: null,
      lastUsedIp: null,
      lastUsedChannel: null,
      createdAt: '',
      updatedAt: '',
    },
    capabilities: [],
    scopes: [],
    credentials: [],
  };
}

describe('grantableExternalAgents', () => {
  it('excludes REVOKED agents and already granted ids', () => {
    const rows = grantableExternalAgents(
      [
        bundle('a', 'ACTIVE'),
        bundle('b', 'REVOKED'),
        bundle('c', 'DISABLED'),
        bundle('d', 'EXPIRED'),
      ],
      new Set(['c']),
    );
    expect(rows.map((row) => row.agent.id)).toEqual(['a']);
  });
});
