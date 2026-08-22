import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { findPersistedSecretFields, findRawTokenFields } from './ai-admin-secrets';
import { startAiAdminHarness, type AiAdminHarness } from './ai-admin.http.harness';

const ONE_TIME_TOKEN = 'nbos_agt_aabbccddeeff001122_secret';

describe('AI admin HTTP secret redaction', () => {
  let harness: AiAdminHarness;

  beforeAll(async () => {
    harness = await startAiAdminHarness();
  });

  afterAll(async () => {
    await harness?.close();
  });

  beforeEach(() => {
    harness.setEmployeeAccess(true);
  });

  it('returns a one-time token on issue and never on later list', async () => {
    harness.services.credentials.issue.mockResolvedValue({
      credential: {
        id: 'cred-1',
        agentId: 'agent-1',
        keyId: 'aabbccddeeff001122',
        tokenPrefix: 'nbos_agt_aabbcc',
        label: null,
        state: 'ACTIVE',
        expiresAt: null,
        revokedAt: null,
        lastUsedAt: null,
        rotatedFromId: null,
        createdAt: new Date('2026-08-22T00:00:00.000Z'),
      },
      token: ONE_TIME_TOKEN,
    });
    harness.services.credentials.listForAgent.mockResolvedValue([
      {
        id: 'cred-1',
        agentId: 'agent-1',
        keyId: 'aabbccddeeff001122',
        tokenPrefix: 'nbos_agt_aabbcc',
        label: null,
        state: 'ACTIVE',
        expiresAt: null,
        revokedAt: null,
        lastUsedAt: null,
        rotatedFromId: null,
        createdAt: new Date('2026-08-22T00:00:00.000Z'),
      },
    ]);

    const issued = await harness.employeeFetch('/ai-admin/external-agents/agent-1/credentials', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const issuedBody = await issued.json();
    expect(issued.status).toBe(201);
    expect(issuedBody.data.token).toBe(ONE_TIME_TOKEN);
    expect(findPersistedSecretFields(issuedBody)).toEqual([]);

    const listed = await harness.employeeFetch('/ai-admin/external-agents/agent-1/credentials');
    const listedBody = await listed.json();
    expect(listed.status).toBe(200);
    expect(findRawTokenFields(listedBody)).toEqual([]);
    expect(findPersistedSecretFields(listedBody)).toEqual([]);
    expect(JSON.stringify(listedBody)).not.toContain(ONE_TIME_TOKEN);
  });

  it('never echoes a provider apiKey after create', async () => {
    harness.services.connections.create.mockResolvedValue({
      id: 'conn-1',
      provider: 'OPENAI',
      name: 'Prod OpenAI',
      status: 'ACTIVE',
      keyPrefix: 'sk-ab',
      providerOrganizationId: null,
      providerProjectId: null,
      baseUrl: null,
      lastValidatedAt: null,
      lastModelSyncAt: null,
      createdById: 'employee-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await harness.employeeFetch('/ai-admin/providers', {
      method: 'POST',
      body: JSON.stringify({
        provider: 'OPENAI',
        name: 'Prod OpenAI',
        apiKey: 'sk-super-secret-value',
      }),
    });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(findPersistedSecretFields(body)).toEqual([]);
    expect(JSON.stringify(body)).not.toContain('sk-super-secret-value');
    expect(body.data.keyPrefix).toBe('sk-ab');
  });
});
