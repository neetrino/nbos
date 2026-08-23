import { NotFoundException } from '@nestjs/common';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { startAiAdminHarness, type AiAdminHarness } from './ai-admin.http.harness';

describe('AI admin nested ownership HTTP', () => {
  let harness: AiAdminHarness;

  beforeAll(async () => {
    harness = await startAiAdminHarness();
  });

  afterAll(async () => {
    await harness?.close();
  });

  beforeEach(() => {
    harness.setEmployeeAccess(true);
    harness.services.credentials.requireOnAgent.mockReset();
    harness.services.grants.requireScopeOnAgent.mockReset();
    harness.services.grants.requireScopeOnWorkspace.mockReset();
    harness.services.credentials.rotate.mockReset();
    harness.services.grants.revokeScope.mockReset();
  });

  it('returns 404 when rotating a credential that does not belong to the agent', async () => {
    harness.services.credentials.requireOnAgent.mockRejectedValue(
      new NotFoundException('Credential not found'),
    );

    const response = await harness.employeeFetch(
      '/ai-admin/external-agents/agent-1/credentials/foreign-cred/rotate',
      { method: 'POST', body: JSON.stringify({}) },
    );

    expect(response.status).toBe(404);
    expect(harness.services.credentials.rotate).not.toHaveBeenCalled();
  });

  it('returns 404 when revoking a scope that does not belong to the agent', async () => {
    harness.services.grants.requireScopeOnAgent.mockRejectedValue(
      new NotFoundException('Resource scope not found'),
    );

    const response = await harness.employeeFetch(
      '/ai-admin/external-agents/agent-1/scopes/foreign-scope',
      { method: 'DELETE' },
    );

    expect(response.status).toBe(404);
    expect(harness.services.grants.revokeScope).not.toHaveBeenCalled();
  });

  it('returns 404 when revoking a Work Space grant from another workspace', async () => {
    harness.services.grants.requireScopeOnWorkspace.mockRejectedValue(
      new NotFoundException('Resource scope not found'),
    );

    const response = await harness.employeeFetch('/ai-admin/workspaces/ws-1/access/foreign-scope', {
      method: 'DELETE',
    });

    expect(response.status).toBe(404);
    expect(harness.services.grants.revokeScope).not.toHaveBeenCalled();
  });
});
