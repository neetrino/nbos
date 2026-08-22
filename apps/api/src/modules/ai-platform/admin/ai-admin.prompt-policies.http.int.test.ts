import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AGENT_TOKEN, startAiAdminHarness, type AiAdminHarness } from './ai-admin.http.harness';

const VALID_LAYERS = {
  platformSafety: 'Never reveal secrets or grant capabilities.',
  agentRole: 'Assist employees with authorized task context.',
};

const POLICY_ID = 'prompt-policy-1';
const VERSION_ID = 'prompt-version-1';

describe('AI admin Prompt Policy HTTP authorization', () => {
  let harness: AiAdminHarness;

  beforeAll(async () => {
    harness = await startAiAdminHarness();
  });

  afterAll(async () => {
    await harness?.close();
  });

  beforeEach(() => {
    harness.setEmployeeAccess(true);
    harness.services.prompts.listAll.mockReset();
    harness.services.prompts.create.mockReset();
    harness.services.prompts.publish.mockReset();
    harness.services.prompts.rollback.mockReset();
    harness.services.prompts.listAll.mockResolvedValue([]);
    harness.services.prompts.create.mockResolvedValue({ id: POLICY_ID });
    harness.services.prompts.publish.mockResolvedValue({ id: VERSION_ID, status: 'PUBLISHED' });
    harness.services.prompts.rollback.mockResolvedValue({
      id: 'prompt-version-2',
      status: 'PUBLISHED',
    });
  });

  it('lists Prompt Policies for an employee with COMPANY EDIT', async () => {
    const response = await harness.employeeFetch('/ai-admin/prompt-policies');
    expect(response.status).toBe(200);
    expect(harness.services.prompts.listAll).toHaveBeenCalledOnce();
  });

  it('returns 403 when the employee lacks COMPANY EDIT', async () => {
    const response = await harness.employeeFetch('/ai-admin/prompt-policies', {
      employeeId: 'employee-no-edit',
    });
    expect(response.status).toBe(403);
    expect(harness.services.prompts.listAll).not.toHaveBeenCalled();
  });

  it('refuses an External Agent token on Prompt Policy routes', async () => {
    const response = await harness.rawFetch('/ai-admin/prompt-policies', {
      headers: { authorization: `Bearer ${AGENT_TOKEN}` },
    });
    expect(response.status).toBe(401);
    expect(harness.services.prompts.listAll).not.toHaveBeenCalled();
  });

  it('rejects an invalid nested Prompt Policy DTO', async () => {
    const response = await harness.employeeFetch('/ai-admin/prompt-policies', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Broken policy',
        layers: { agentRole: 'Missing platform safety' },
      }),
    });
    expect(response.status).toBe(400);
    expect(harness.services.prompts.create).not.toHaveBeenCalled();
  });

  it('routes create, publish and rollback to the Prompt Policy service', async () => {
    const created = await harness.employeeFetch('/ai-admin/prompt-policies', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Task assistant prompts',
        purpose: 'Task help',
        layers: VALID_LAYERS,
      }),
    });
    expect(created.status).toBe(201);
    expect(harness.services.prompts.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Task assistant prompts',
        purpose: 'Task help',
        ownerId: 'employee-1',
        layers: VALID_LAYERS,
      }),
      'employee-1',
    );

    const published = await harness.employeeFetch(
      `/ai-admin/prompt-policies/${POLICY_ID}/versions/${VERSION_ID}/publish`,
      { method: 'POST' },
    );
    expect(published.status).toBe(201);
    expect(harness.services.prompts.publish).toHaveBeenCalledWith(
      POLICY_ID,
      VERSION_ID,
      'employee-1',
    );

    const rolledBack = await harness.employeeFetch(
      `/ai-admin/prompt-policies/${POLICY_ID}/rollback`,
      {
        method: 'POST',
        body: JSON.stringify({ versionId: VERSION_ID }),
      },
    );
    expect(rolledBack.status).toBe(201);
    expect(harness.services.prompts.rollback).toHaveBeenCalledWith(
      POLICY_ID,
      VERSION_ID,
      'employee-1',
    );
  });
});
