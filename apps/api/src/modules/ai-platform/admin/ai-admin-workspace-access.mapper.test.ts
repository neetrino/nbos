import { describe, expect, it } from 'vitest';
import { toWorkspaceAccessRows } from './ai-admin-workspace-access.mapper';

describe('toWorkspaceAccessRows', () => {
  it('keeps only active capabilities from the same grant tables', () => {
    const rows = toWorkspaceAccessRows('ws-1', [
      {
        scope: {
          id: 'scope-1',
          agentId: 'agent-1',
          scopeType: 'WORKSPACE',
          scopeId: 'ws-1',
          resourceType: null,
          reason: null,
          expiresAt: null,
          revokedAt: null,
          createdAt: new Date(),
        },
        agent: {
          id: 'agent-1',
          name: 'Cursor',
          description: null,
          state: 'ACTIVE',
          ownerId: 'e1',
          createdById: 'e1',
          expiresAt: null,
          revokedAt: null,
          lastUsedAt: null,
          lastUsedIp: null,
          lastUsedChannel: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        capabilities: [
          {
            id: 'g1',
            agentId: 'agent-1',
            capabilityKey: 'tasks.read',
            reason: null,
            expiresAt: null,
            revokedAt: null,
            createdAt: new Date(),
          },
          {
            id: 'g2',
            agentId: 'agent-1',
            capabilityKey: 'tasks.create',
            reason: null,
            expiresAt: null,
            revokedAt: new Date(),
            createdAt: new Date(),
          },
          {
            id: 'g3',
            agentId: 'agent-1',
            capabilityKey: 'tasks.update',
            reason: null,
            expiresAt: new Date('2020-01-01T00:00:00.000Z'),
            revokedAt: null,
            createdAt: new Date(),
          },
        ],
      },
    ]);

    expect(rows[0]?.workspaceId).toBe('ws-1');
    expect(rows[0]?.capabilities.map((item) => item.capabilityKey)).toEqual(['tasks.read']);
  });
});
