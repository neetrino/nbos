import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { startAiAdminHarness, type AiAdminHarness } from './ai-admin.http.harness';

describe('AI admin provider draft validate HTTP', () => {
  let harness: AiAdminHarness;

  beforeAll(async () => {
    harness = await startAiAdminHarness();
  });

  afterAll(async () => {
    await harness?.close();
  });

  beforeEach(() => {
    harness.setEmployeeAccess(true);
    harness.services.connections.validateDraft.mockReset();
    harness.services.connections.validateReplacementKey.mockReset();
    harness.services.catalog.listAll.mockReset();
    harness.services.policies.listAll.mockReset();
    harness.services.internalAgents.listAll.mockReset();
  });

  it('validates an Anthropic draft key with the Anthropic provider field', async () => {
    harness.services.connections.validateDraft.mockResolvedValue({ ok: true, errorCode: null });

    const response = await harness.employeeFetch('/ai-admin/providers/validate-draft', {
      method: 'POST',
      body: JSON.stringify({
        provider: 'ANTHROPIC',
        apiKey: 'sk-ant-test-provider-secret-value',
      }),
    });

    expect(response.status).toBe(201);
    expect(harness.services.connections.validateDraft).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'ANTHROPIC' }),
    );
  });

  it('forwards a custom baseUrl on draft validate', async () => {
    harness.services.connections.validateDraft.mockResolvedValue({ ok: true, errorCode: null });

    const response = await harness.employeeFetch('/ai-admin/providers/validate-draft', {
      method: 'POST',
      body: JSON.stringify({
        provider: 'ANTHROPIC',
        apiKey: 'sk-ant-test-provider-secret-value',
        baseUrl: 'https://anthropic.example.test',
      }),
    });

    expect(response.status).toBe(201);
    expect(harness.services.connections.validateDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'ANTHROPIC',
        baseUrl: 'https://anthropic.example.test',
      }),
    );
  });

  it('validates an OpenAI draft key with the OpenAI provider field', async () => {
    harness.services.connections.validateDraft.mockResolvedValue({ ok: true, errorCode: null });

    const response = await harness.employeeFetch('/ai-admin/providers/validate-draft', {
      method: 'POST',
      body: JSON.stringify({
        provider: 'OPENAI',
        apiKey: 'sk-test-provider-secret-value-12345',
      }),
    });

    expect(response.status).toBe(201);
    expect(harness.services.connections.validateDraft).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'OPENAI' }),
    );
  });

  it('validates a replacement key without client-supplied org or project', async () => {
    harness.services.connections.validateReplacementKey.mockResolvedValue({
      ok: true,
      errorCode: null,
    });

    const response = await harness.employeeFetch(
      '/ai-admin/providers/conn-1/validate-replacement',
      {
        method: 'POST',
        body: JSON.stringify({ apiKey: 'sk-test-provider-secret-value-99999' }),
      },
    );

    expect(response.status).toBe(201);
    expect(harness.services.connections.validateReplacementKey).toHaveBeenCalledWith(
      'conn-1',
      'sk-test-provider-secret-value-99999',
    );
  });

  it('returns named disable-impact for a model', async () => {
    harness.services.catalog.listAll.mockResolvedValue([{ id: 'm1', connectionId: 'c1' }]);
    harness.services.policies.listAll.mockResolvedValue([
      { id: 'p1', name: 'Chat', status: 'ACTIVE', candidates: [{ modelId: 'm1' }] },
    ]);
    harness.services.internalAgents.listAll.mockResolvedValue([
      { id: 'a1', name: 'Inbox', modelPolicyId: 'p1' },
    ]);

    const response = await harness.employeeFetch('/ai-admin/disable-impact?kind=model&id=m1');
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      data: { policies: Array<{ name: string }>; agents: Array<{ name: string }> };
    };
    expect(body.data.policies.map((item) => item.name)).toEqual(['Chat']);
    expect(body.data.agents.map((item) => item.name)).toEqual(['Inbox']);
  });
});
