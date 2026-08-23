import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AgentAccessException } from '../auth/agent-auth.errors';
import {
  AGENT_TOKEN,
  AGENT_TOKEN_SECRET,
  signEmployeeAccessToken,
  startAgentProtocolHarness,
  type AgentProtocolHarness,
} from './agent-protocol.http.harness';

/**
 * Employee-vs-Agent boundary over real HTTP (checklist G 140).
 *
 * Everything here is about *who* the request is, not what it does: which
 * credential forms are accepted, which guard chain runs, and what a rejection
 * discloses. Capability routing and MCP transport live in
 * `agent-protocol.http.transport.int.test.ts` against the same harness.
 */
describe('agent protocol over HTTP: employee boundary', () => {
  let harness: AgentProtocolHarness;

  beforeAll(async () => {
    harness = await startAgentProtocolHarness();
  });

  afterAll(async () => {
    await harness?.close();
  });

  beforeEach(() => {
    harness.resetMocks();
  });

  it('serves an agent route with an agent token and no employee session', async () => {
    const response = await harness.agentFetch('/v1/agent/me');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      data: {
        agentId: 'agent-1',
        agentName: 'Cursor Agent',
        actorType: 'EXTERNAL_AGENT',
        credentialKeyId: 'aabbccddeeff001122',
        channel: 'rest',
        correlationId: 'corr-1',
      },
    });
  });

  it('does not wrap agent responses in the employee transform envelope', async () => {
    const body = (await (await harness.agentFetch('/v1/agent/me')).json()) as Record<
      string,
      unknown
    >;

    expect(body).not.toHaveProperty('timestamp');
  });

  it('still rejects an employee route that has no valid employee JWT', async () => {
    const response = await harness.agentFetch('/tasks/probe');

    expect(response.status).toBe(401);
    const body = (await response.json()) as Record<string, unknown>;
    expect(body.error).toBe('Unauthorized');
    expect(body).not.toHaveProperty('code');
  });

  it('never lets an agent credential reach an employee permission check', async () => {
    await harness.agentFetch('/tasks/probe');

    expect(harness.authenticate).not.toHaveBeenCalled();
  });

  it('refuses a valid employee access token on the agent namespace', async () => {
    const response = await harness.rawFetch('/v1/agent/me', {
      headers: { authorization: `Bearer ${signEmployeeAccessToken()}` },
    });

    expect(response.status).toBe(401);
    expect((await response.json()).error.code).toBe('AGENT_AUTH_INVALID');
  });

  it('never promotes an employee token into an agent actor', async () => {
    await harness.rawFetch('/v1/agent/me', {
      headers: { authorization: `Bearer ${signEmployeeAccessToken()}` },
    });

    expect(harness.gatewayInvoke).not.toHaveBeenCalled();
  });

  it('rejects a missing Authorization header with the machine envelope', async () => {
    const response = await harness.rawFetch('/v1/agent/me');

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: {
        code: 'AGENT_AUTH_INVALID',
        message: 'Authentication failed.',
        requestId: expect.any(String),
      },
    });
  });

  it('never accepts a token from the query string', async () => {
    const response = await harness.rawFetch(`/v1/agent/me?token=${AGENT_TOKEN}`);

    expect(response.status).toBe(401);
    expect(harness.authenticate).not.toHaveBeenCalled();
  });

  it('rejects a credential the authenticator refuses', async () => {
    harness.authenticate.mockRejectedValue(
      AgentAccessException.fromDenyReason('CREDENTIAL_REVOKED'),
    );

    const response = await harness.agentFetch('/v1/agent/me');

    expect(response.status).toBe(401);
    expect((await response.json()).error.code).toBe('AGENT_CREDENTIAL_REVOKED');
  });

  it('never echoes the presented credential in an error body', async () => {
    harness.authenticate.mockRejectedValue(
      AgentAccessException.fromDenyReason('CREDENTIAL_INVALID'),
    );

    const body = await (await harness.agentFetch('/v1/agent/me')).text();

    expect(body).not.toContain(AGENT_TOKEN);
    expect(body).not.toContain(AGENT_TOKEN_SECRET);
  });

  describe('correlation', () => {
    it('mints a correlation id when the client sends none', async () => {
      await harness.agentFetch('/v1/agent/tasks/task-1');

      const context = harness.authenticate.mock.calls[0][1];
      expect(context.correlationId).toEqual(expect.any(String));
      expect(context.correlationId.length).toBeGreaterThan(0);
    });

    it('propagates a client-supplied correlation id and echoes it back', async () => {
      const response = await harness.agentFetch('/v1/agent/tasks/task-1', {
        headers: { 'x-correlation-id': 'cursor-run-7' },
      });

      expect(harness.authenticate.mock.calls[0][1].correlationId).toBe('cursor-run-7');
      expect(response.headers.get('x-correlation-id')).toBe('cursor-run-7');
    });

    it('returns a correlation id on a failure too', async () => {
      harness.gatewayInvoke.mockRejectedValue(AgentAccessException.resourceNotAvailable());

      const response = await harness.agentFetch('/v1/agent/tasks/task-1', {
        headers: { 'x-correlation-id': 'cursor-run-8' },
      });

      expect(response.headers.get('x-correlation-id')).toBe('cursor-run-8');
      expect((await response.json()).error.requestId).toBe('cursor-run-8');
    });
  });
});
