import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { startAiAdminHarness, type AiAdminHarness } from './ai-admin.http.harness';

describe('AI admin Work Space access HTTP', () => {
  let harness: AiAdminHarness;

  beforeAll(async () => {
    harness = await startAiAdminHarness();
  });

  afterAll(async () => {
    await harness?.close();
  });

  beforeEach(() => {
    harness.setEmployeeAccess(true);
    harness.services.grants.listActiveWorkspaceScopes.mockResolvedValue([]);
    harness.services.grants.grantScope.mockResolvedValue({
      id: 'scope-1',
      agentId: 'agent-1',
      scopeType: 'WORKSPACE',
      scopeId: 'ws-1',
    });
  });

  it('lists and grants through the same AgentGrantService', async () => {
    const listed = await harness.employeeFetch('/ai-admin/workspaces/ws-1/access');
    expect(listed.status).toBe(200);
    expect(harness.services.grants.listActiveWorkspaceScopes).toHaveBeenCalledWith('ws-1');

    const granted = await harness.employeeFetch('/ai-admin/workspaces/ws-1/access', {
      method: 'POST',
      body: JSON.stringify({ agentId: 'agent-1' }),
    });
    expect(granted.status).toBe(201);
    expect(harness.services.grants.grantScope).toHaveBeenCalledWith(
      expect.objectContaining({
        agentId: 'agent-1',
        scopeType: 'WORKSPACE',
        scopeId: 'ws-1',
      }),
      'employee-1',
    );
  });
});
