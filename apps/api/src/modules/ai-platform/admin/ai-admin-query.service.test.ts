import { describe, expect, it, vi } from 'vitest';
import { AiAdminQueryService } from './ai-admin-query.service';

describe('AiAdminQueryService', () => {
  it('composes workspace access from the same grant table', async () => {
    const grants = {
      listActiveWorkspaceScopes: vi.fn().mockResolvedValue([
        {
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
      ]),
      listCapabilities: vi.fn().mockResolvedValue([
        {
          id: 'grant-1',
          agentId: 'agent-1',
          capabilityKey: 'tasks.read',
          reason: null,
          expiresAt: null,
          revokedAt: null,
          createdAt: new Date(),
        },
      ]),
    };
    const agents = {
      findById: vi.fn().mockResolvedValue({
        id: 'agent-1',
        name: 'Cursor',
        state: 'ACTIVE',
      }),
      listAll: vi.fn(),
    };
    const query = new AiAdminQueryService(
      agents as never,
      grants as never,
      { listForAgent: vi.fn() } as never,
      { listAll: vi.fn() } as never,
      { listAll: vi.fn() } as never,
      { listAll: vi.fn() } as never,
      { findById: vi.fn() } as never,
      { findRecentByEntityTypes: vi.fn() } as never,
    );

    const rows = await query.listWorkspaceAccess('ws-1');

    expect(grants.listActiveWorkspaceScopes).toHaveBeenCalledWith('ws-1');
    expect(rows).toHaveLength(1);
    expect(rows[0]?.agent?.id).toBe('agent-1');
    expect(rows[0]?.capabilities[0]?.capabilityKey).toBe('tasks.read');
  });

  it('lists grantable capabilities without forbidden Phase 1 keys', () => {
    const query = new AiAdminQueryService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    const keys = query.listCapabilities().map((item) => item.key);

    expect(keys).toContain('tasks.read');
    expect(keys).toContain('tasks.create');
    expect(keys).not.toContain('tasks.delete');
    expect(keys).not.toContain('tasks.force_complete');
  });

  it('loads agent activity from agent, credential, grant and scope ids', async () => {
    const findRecentByEntityRefs = vi
      .fn()
      .mockResolvedValue({ items: [{ id: 'log-1' }], meta: {} });
    const query = new AiAdminQueryService(
      { findById: vi.fn().mockResolvedValue({ id: 'agent-1' }) } as never,
      {
        listCapabilities: vi.fn().mockResolvedValue([{ id: 'cap-1' }]),
        listScopes: vi.fn().mockResolvedValue([{ id: 'scope-1' }]),
      } as never,
      { listForAgent: vi.fn().mockResolvedValue([{ id: 'cred-1' }]) } as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      { findRecentByEntityRefs } as never,
    );

    const result = await query.getExternalAgentActivity('agent-1');

    expect(findRecentByEntityRefs).toHaveBeenCalledWith(
      [
        { entityType: 'EXTERNAL_AGENT', entityId: 'agent-1' },
        { entityType: 'EXTERNAL_AGENT_CREDENTIAL', entityId: 'cred-1' },
        { entityType: 'EXTERNAL_AGENT_CAPABILITY_GRANT', entityId: 'cap-1' },
        { entityType: 'EXTERNAL_AGENT_RESOURCE_SCOPE', entityId: 'scope-1' },
      ],
      {},
    );
    expect(result.items).toHaveLength(1);
  });

  it('projects disable impact from catalog, policies and Internal Agents', async () => {
    const query = new AiAdminQueryService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {
        listAll: vi.fn().mockResolvedValue([
          {
            id: 'p1',
            name: 'Chat',
            status: 'ACTIVE',
            candidates: [{ modelId: 'm1' }],
          },
        ]),
      } as never,
      { listAll: vi.fn().mockResolvedValue([{ id: 'm1', connectionId: 'c1' }]) } as never,
      {
        listAll: vi.fn().mockResolvedValue([{ id: 'a1', name: 'Inbox', modelPolicyId: 'p1' }]),
      } as never,
      {} as never,
    );

    const impact = await query.getDisableImpact('model', 'm1');
    expect(impact.policies.map((item) => item.name)).toEqual(['Chat']);
    expect(impact.agents.map((item) => item.name)).toEqual(['Inbox']);
  });
});
