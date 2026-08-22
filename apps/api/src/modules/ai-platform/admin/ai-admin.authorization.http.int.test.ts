import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AGENT_TOKEN, startAiAdminHarness, type AiAdminHarness } from './ai-admin.http.harness';

describe('AI admin HTTP authorization', () => {
  let harness: AiAdminHarness;

  beforeAll(async () => {
    harness = await startAiAdminHarness();
  });

  afterAll(async () => {
    await harness?.close();
  });

  beforeEach(() => {
    harness.setEmployeeAccess(true);
    harness.services.agents.listAll.mockResolvedValue([]);
    harness.services.connections.listAll.mockResolvedValue([]);
    harness.services.policies.listAll.mockResolvedValue([]);
    harness.services.audit.findRecentByEntityTypes.mockReset();
    harness.services.audit.findRecentByEntityTypes.mockResolvedValue({
      items: [],
      meta: { total: 0, page: 1, pageSize: 8, totalPages: 0 },
    });
    harness.services.grants.listActiveWorkspaceScopes.mockResolvedValue([]);
  });

  it('serves an employee admin route with COMPANY EDIT', async () => {
    const response = await harness.employeeFetch('/ai-admin/overview');

    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: { pendingApprovals: number } };
    expect(body.data.pendingApprovals).toBe(0);
  });

  it('returns 403 when the employee lacks COMPANY EDIT', async () => {
    const response = await harness.employeeFetch('/ai-admin/overview', {
      employeeId: 'employee-no-edit',
    });

    expect(response.status).toBe(403);
    const body = (await response.json()) as { message: string };
    expect(body.message).toContain('COMPANY.EDIT');
  });

  it('refuses an External Agent token on admin routes', async () => {
    const response = await harness.rawFetch('/ai-admin/overview', {
      headers: { authorization: `Bearer ${AGENT_TOKEN}` },
    });

    expect(response.status).toBe(401);
    const body = (await response.json()) as { error: string };
    expect(body.error).toMatch(/Invalid or expired token|Unauthorized/i);
  });

  it('refuses an agent token on a mutating admin route', async () => {
    const response = await harness.rawFetch('/ai-admin/external-agents', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${AGENT_TOKEN}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ name: 'Should not create' }),
    });

    expect(response.status).toBe(401);
    expect(harness.services.agents.create).not.toHaveBeenCalled();
  });

  it('refuses an agent token on contextual Work Space access', async () => {
    const response = await harness.rawFetch('/ai-admin/workspaces/ws-1/access', {
      headers: { authorization: `Bearer ${AGENT_TOKEN}` },
    });

    expect(response.status).toBe(401);
    expect(harness.services.grants.listActiveWorkspaceScopes).not.toHaveBeenCalled();
  });

  it('rejects invalid activity pagination', async () => {
    const response = await harness.employeeFetch('/ai-admin/activity?page=-1&pageSize=9999');
    expect(response.status).toBe(400);
    expect(harness.services.audit.findRecentByEntityTypes).not.toHaveBeenCalled();
  });

  it('returns 403 for Work Space access without COMPANY EDIT', async () => {
    const response = await harness.employeeFetch('/ai-admin/workspaces/ws-1/access', {
      employeeId: 'employee-no-edit',
    });

    expect(response.status).toBe(403);
    expect(harness.services.grants.listActiveWorkspaceScopes).not.toHaveBeenCalled();
  });
});
