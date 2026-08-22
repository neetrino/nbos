import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { toAgentExternalError } from '@nbos/shared';
import { buildLoggerParams } from '../../../config/logger.config';
import { AgentAccessException } from '../auth/agent-auth.errors';
import {
  AGENT_TOKEN,
  AGENT_TOKEN_SECRET,
  startAgentProtocolHarness,
  type AgentProtocolHarness,
} from '../protocol/agent-protocol.http.harness';

const UNAUTHORIZED = 401;
const FORBIDDEN = 403;
const BAD_REQUEST = 400;

/** Every state an admin can put an agent or credential into that must stop traffic. */
const BLOCKING_DENY_REASONS = [
  'CREDENTIAL_REVOKED',
  'CREDENTIAL_EXPIRED',
  'AGENT_DISABLED',
  'AGENT_REVOKED',
  'AGENT_EXPIRED',
] as const;

/**
 * AL 603-604, 609-610, 613-616 over real HTTP.
 *
 * The point of every case here is that the answer is the same on both
 * protocols and that a refusal discloses nothing: not the credential, not
 * whether the target exists, not what the vault holds.
 */
describe('External Agent security boundary over HTTP', () => {
  let harness: AgentProtocolHarness;

  function mcp(body: unknown): Promise<Response> {
    return harness.agentFetch('/v1/agent/mcp', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  function callTool(): Promise<Response> {
    return mcp({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name: 'nbos_get_task', arguments: { taskId: 'task-1' } },
    });
  }

  beforeAll(async () => {
    harness = await startAgentProtocolHarness();
  });

  afterAll(async () => {
    await harness?.close();
  });

  beforeEach(() => {
    harness.resetMocks();
  });

  describe('Credentials vault and Employee APIs (AL 603-604)', () => {
    it('refuses an agent credential on the Credentials secret reveal route', async () => {
      const response = await harness.agentFetch('/credentials/cred-1/secrets/reveal', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ field: 'password' }),
      });

      expect(response.status).toBe(UNAUTHORIZED);
      expect(await response.text()).not.toContain('vault-plaintext');
    });

    it('never runs the agent authenticator for an Employee-only route', async () => {
      await harness.agentFetch('/credentials/cred-1/secrets/reveal', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ field: 'password' }),
      });
      await harness.agentFetch('/tasks/probe');

      expect(harness.authenticate).not.toHaveBeenCalled();
      expect(harness.gatewayInvoke).not.toHaveBeenCalled();
    });
  });

  describe('revocation and disable block both protocols (AL 613-615)', () => {
    it.each(BLOCKING_DENY_REASONS)('refuses REST after %s', async (denyReason) => {
      const expected = toAgentExternalError(denyReason);
      harness.authenticate.mockRejectedValue(AgentAccessException.fromDenyReason(denyReason));

      const response = await harness.agentFetch('/v1/agent/tasks/task-1');

      expect(response.status).toBe(expected.status);
      expect((await response.json()).error.code).toBe(expected.code);
      expect(harness.gatewayInvoke).not.toHaveBeenCalled();
    });

    it.each(BLOCKING_DENY_REASONS)('refuses MCP after %s', async (denyReason) => {
      const expected = toAgentExternalError(denyReason);
      harness.authenticate.mockRejectedValue(AgentAccessException.fromDenyReason(denyReason));

      const response = await callTool();

      expect(response.status).toBe(expected.status);
      expect((await response.json()).error.code).toBe(expected.code);
      expect(harness.gatewayInvoke).not.toHaveBeenCalled();
    });

    it('blocks a second credential of the same disabled agent', async () => {
      harness.authenticate.mockRejectedValue(AgentAccessException.fromDenyReason('AGENT_DISABLED'));
      const otherCredential = `nbos_agt_${'ffeeddccbbaa998877'}_${'b2'.repeat(32)}`;

      const response = await harness.rawFetch('/v1/agent/tasks/task-1', {
        headers: { authorization: `Bearer ${otherCredential}` },
      });

      expect(response.status).toBe(FORBIDDEN);
      expect((await response.json()).error.code).toBe('AGENT_DISABLED');
    });
  });

  describe('REST and MCP enforce the same isolation (AL 609)', () => {
    it('returns the same code for an out-of-scope resource on both protocols', async () => {
      harness.gatewayInvoke.mockRejectedValue(
        AgentAccessException.fromDenyReason('RESOURCE_OUT_OF_SCOPE'),
      );

      const rest = await (await harness.agentFetch('/v1/agent/tasks/task-1')).json();
      const tool = await (await callTool()).json();

      expect(tool.result.isError).toBe(true);
      expect(tool.result.structuredContent.error.code).toBe(rest.error.code);
      expect(tool.result.structuredContent.error.message).toBe(rest.error.message);
    });

    it('routes both protocols through the same capability, not two permission models', async () => {
      await harness.agentFetch('/v1/agent/tasks/task-1');
      const restInvocation = harness.gatewayInvoke.mock.calls[0][0];

      harness.gatewayInvoke.mockClear();
      await callTool();
      const mcpInvocation = harness.gatewayInvoke.mock.calls[0][0];

      expect(mcpInvocation.capabilityKey).toBe(restInvocation.capabilityKey);
      expect(mcpInvocation.input).toEqual(restInvocation.input);
      expect(mcpInvocation.agent.agentId).toBe(restInvocation.agent.agentId);
    });
  });

  describe('credential material never travels back (AL 610-611)', () => {
    it('redacts the Authorization header in request logs', () => {
      const redact = buildLoggerParams().pinoHttp?.redact;
      const paths = Array.isArray(redact) ? redact : (redact?.paths ?? []);

      expect(paths).toContain('req.headers.authorization');
      expect(paths).toContain('req.headers.cookie');
    });

    it('never echoes the presented token in a success body or headers', async () => {
      const response = await harness.agentFetch('/v1/agent/me');
      const raw = `${await response.text()}${JSON.stringify([...response.headers])}`;

      expect(raw).not.toContain(AGENT_TOKEN);
      expect(raw).not.toContain(AGENT_TOKEN_SECRET);
    });

    it('never echoes the presented token in an MCP error body', async () => {
      harness.gatewayInvoke.mockRejectedValue(
        AgentAccessException.fromDenyReason('CAPABILITY_NOT_GRANTED'),
      );

      const raw = await (await callTool()).text();

      expect(raw).not.toContain(AGENT_TOKEN);
      expect(raw).not.toContain(AGENT_TOKEN_SECRET);
    });
  });

  describe('malformed input is refused before the domain (AL 616)', () => {
    it('rejects a body that is not JSON', async () => {
      const response = await harness.agentFetch('/v1/agent/tasks/task-1/comments', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{"body": ',
      });

      expect(response.status).toBe(BAD_REQUEST);
      expect(harness.gatewayInvoke).not.toHaveBeenCalled();
    });

    it('forwards an unknown JSON field to the gateway allowlist rather than dropping it', async () => {
      await harness.agentFetch('/v1/agent/tasks/task-1/comments', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'idempotency-key': 'op-1' },
        body: JSON.stringify({ body: 'note', escalate: true }),
      });

      // Silently stripping here would hide the field from `pickCapabilityInput`,
      // which is the component that must refuse it.
      expect(harness.gatewayInvoke).toHaveBeenCalledWith(
        expect.objectContaining({ input: expect.objectContaining({ escalate: true }) }),
      );
    });

    it('rejects a JSON-RPC frame that is not a valid message', async () => {
      const response = await mcp({ jsonrpc: '1.0', id: 1, method: 'tools/call' });

      expect((await response.json()).error).toBeDefined();
      expect(harness.gatewayInvoke).not.toHaveBeenCalled();
    });
  });
});
