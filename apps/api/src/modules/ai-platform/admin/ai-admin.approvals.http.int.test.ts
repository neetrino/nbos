import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AGENT_TOKEN, startAiAdminHarness, type AiAdminHarness } from './ai-admin.http.harness';

const APPROVAL_ID = 'apr-1';

describe('AI admin approval HTTP authorization', () => {
  let harness: AiAdminHarness;

  beforeAll(async () => {
    harness = await startAiAdminHarness();
  });

  afterAll(async () => {
    await harness?.close();
  });

  beforeEach(() => {
    harness.setEmployeeAccess(true);
    harness.services.approvals.listPending.mockReset();
    harness.services.approvals.approve.mockReset();
    harness.services.approvals.reject.mockReset();
    harness.services.approvals.cancel.mockReset();
    harness.services.approvals.listPending.mockResolvedValue([]);
    harness.services.approvals.approve.mockResolvedValue({ id: APPROVAL_ID, status: 'APPROVED' });
    harness.services.approvals.reject.mockResolvedValue({ id: APPROVAL_ID, status: 'REJECTED' });
    harness.services.approvals.cancel.mockResolvedValue({ id: APPROVAL_ID, status: 'CANCELLED' });
  });

  it('lists pending approvals for an employee with COMPANY EDIT', async () => {
    const response = await harness.employeeFetch('/ai-admin/approvals');
    expect(response.status).toBe(200);
    expect(harness.services.approvals.listPending).toHaveBeenCalledOnce();
  });

  it('returns 403 when the employee lacks COMPANY EDIT', async () => {
    const response = await harness.employeeFetch('/ai-admin/approvals', {
      employeeId: 'employee-no-edit',
    });
    expect(response.status).toBe(403);
    expect(harness.services.approvals.listPending).not.toHaveBeenCalled();
  });

  it('refuses an External Agent token on approval routes', async () => {
    const response = await harness.rawFetch('/ai-admin/approvals', {
      headers: { authorization: `Bearer ${AGENT_TOKEN}` },
    });
    expect(response.status).toBe(401);
    expect(harness.services.approvals.listPending).not.toHaveBeenCalled();
  });

  it('rejects an oversized decision reason', async () => {
    const response = await harness.employeeFetch(`/ai-admin/approvals/${APPROVAL_ID}/approve`, {
      method: 'POST',
      body: JSON.stringify({ reason: 'x'.repeat(501) }),
    });
    expect(response.status).toBe(400);
    expect(harness.services.approvals.approve).not.toHaveBeenCalled();
  });

  it('routes approve, reject and cancel to the approval service', async () => {
    const approved = await harness.employeeFetch(`/ai-admin/approvals/${APPROVAL_ID}/approve`, {
      method: 'POST',
      body: JSON.stringify({ reason: 'send allowed' }),
    });
    expect(approved.status).toBe(201);
    expect(harness.services.approvals.approve).toHaveBeenCalledWith(
      APPROVAL_ID,
      'employee-1',
      'send allowed',
    );

    const rejected = await harness.employeeFetch(`/ai-admin/approvals/${APPROVAL_ID}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason: 'too risky' }),
    });
    expect(rejected.status).toBe(201);
    expect(harness.services.approvals.reject).toHaveBeenCalledWith(
      APPROVAL_ID,
      'employee-1',
      'too risky',
    );

    const cancelled = await harness.employeeFetch(`/ai-admin/approvals/${APPROVAL_ID}/cancel`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    expect(cancelled.status).toBe(201);
    expect(harness.services.approvals.cancel).toHaveBeenCalledWith(
      APPROVAL_ID,
      'employee-1',
      undefined,
    );
  });
});
