import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AgentAccessException } from '../auth/agent-auth.errors';
import {
  startAgentProtocolHarness,
  type AgentProtocolHarness,
} from './agent-protocol.http.harness';

const MCP_TOOL_COUNT = 14;
const JSON_RPC_INVALID_REQUEST = -32600;

/**
 * Transport behaviour over real HTTP: which capability a route reaches, how
 * idempotency and binary content travel, and how the MCP endpoint frames the
 * same work. The credential boundary itself is
 * `agent-protocol.http.int.test.ts`.
 */
describe('agent protocol over HTTP: transport', () => {
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

  describe('REST capability routing', () => {
    it('reaches the gateway with the capability behind the route', async () => {
      await harness.agentFetch('/v1/agent/tasks/task-1');

      expect(harness.gatewayInvoke).toHaveBeenCalledWith(
        expect.objectContaining({ capabilityKey: 'tasks.read', input: { taskId: 'task-1' } }),
      );
    });

    it('binds the Idempotency-Key header to the gateway invocation', async () => {
      harness.gatewayInvoke.mockResolvedValue({
        capabilityKey: 'tasks.comment',
        data: { id: 'entry-1' },
      });

      await harness.agentFetch('/v1/agent/tasks/task-1/comments', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'idempotency-key': 'op-77' },
        body: JSON.stringify({ body: 'progress note' }),
      });

      expect(harness.gatewayInvoke).toHaveBeenCalledWith(
        expect.objectContaining({ capabilityKey: 'tasks.comment', idempotencyKey: 'op-77' }),
      );
    });

    it('sends artifact bytes as a binary payload and not as JSON input', async () => {
      harness.gatewayInvoke.mockResolvedValue({ capabilityKey: 'tasks.attach_artifact', data: {} });

      await harness.agentFetch('/v1/agent/tasks/task-1/artifacts', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'idempotency-key': 'op-78' },
        body: JSON.stringify({
          fileName: 'report.txt',
          mimeType: 'text/plain',
          sizeBytes: 6,
          contentBase64: Buffer.from('report').toString('base64'),
        }),
      });

      const invocation = harness.gatewayInvoke.mock.calls[0][0];
      expect(Buffer.from(invocation.payload.bytes).toString('utf8')).toBe('report');
      expect(invocation.input).not.toHaveProperty('contentBase64');
    });

    it('answers a denial and a missing record with the same status and body', async () => {
      harness.gatewayInvoke.mockRejectedValue(AgentAccessException.resourceNotAvailable());
      const missing = await harness.agentFetch('/v1/agent/tasks/task-missing');

      harness.gatewayInvoke.mockRejectedValue(
        AgentAccessException.fromDenyReason('RESOURCE_OUT_OF_SCOPE'),
      );
      const forbidden = await harness.agentFetch('/v1/agent/tasks/task-of-another-agent');

      expect(forbidden.status).toBe(missing.status);
      const [missingBody, forbiddenBody] = await Promise.all([missing.json(), forbidden.json()]);
      expect(forbiddenBody.error.code).toBe(missingBody.error.code);
      expect(forbiddenBody.error.message).toBe(missingBody.error.message);
    });

    it('exposes no delete route in the agent namespace', async () => {
      const response = await harness.agentFetch('/v1/agent/tasks/task-1', { method: 'DELETE' });

      expect(response.status).toBe(404);
      expect(harness.gatewayInvoke).not.toHaveBeenCalled();
    });

    it('turns an unexpected fault into a deterministic machine error', async () => {
      harness.gatewayInvoke.mockRejectedValue(new Error('connect ECONNREFUSED 10.0.0.1:5432'));

      const response = await harness.agentFetch('/v1/agent/tasks/task-1');
      const body = await response.text();

      expect(response.status).toBe(500);
      expect(body).not.toContain('ECONNREFUSED');
      expect(JSON.parse(body).error.code).toBe('AGENT_INTERNAL_ERROR');
    });
  });

  describe('MCP endpoint', () => {
    function rpc(body: unknown, init: RequestInit = {}): Promise<Response> {
      return harness.agentFetch('/v1/agent/mcp', {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...(init.headers ?? {}) },
        body: JSON.stringify(body),
      });
    }

    it('completes an initialize handshake', async () => {
      const response = await rpc({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.result.serverInfo.name).toBe('nbos-external-agent');
      expect(body.result.capabilities.tools).toBeDefined();
    });

    it('resolves the MCP channel on the same credential as REST', async () => {
      await rpc({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} });

      expect(harness.authenticate.mock.calls[0][1].channel).toBe('mcp');
    });

    it('publishes the full tool catalogue', async () => {
      const body = await (await rpc({ jsonrpc: '2.0', id: 2, method: 'tools/list' })).json();

      expect(body.result.tools).toHaveLength(MCP_TOOL_COUNT);
      expect(JSON.stringify(body.result.tools)).not.toContain('delete');
    });

    it('acknowledges a notification without a response body', async () => {
      const response = await rpc({ jsonrpc: '2.0', method: 'notifications/initialized' });

      expect(response.status).toBe(202);
      expect(await response.text()).toBe('');
    });

    it('executes a tool through the same gateway capability as REST', async () => {
      await rpc({
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: { name: 'nbos_get_task', arguments: { taskId: 'task-1' } },
      });

      expect(harness.gatewayInvoke).toHaveBeenCalledWith(
        expect.objectContaining({ capabilityKey: 'tasks.read', input: { taskId: 'task-1' } }),
      );
    });

    it('reports a denial in-band with the REST error code', async () => {
      harness.gatewayInvoke.mockRejectedValue(
        AgentAccessException.fromDenyReason('CAPABILITY_NOT_GRANTED'),
      );

      const body = await (
        await rpc({
          jsonrpc: '2.0',
          id: 4,
          method: 'tools/call',
          params: { name: 'nbos_create_task', arguments: { workspaceId: 'ws-1', title: 'T' } },
        })
      ).json();

      expect(body.result.isError).toBe(true);
      expect(body.result.structuredContent.error.code).toBe('AGENT_CAPABILITY_DENIED');
    });

    it('requires the same credential as REST', async () => {
      const response = await harness.rawFetch('/v1/agent/mcp', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
      });

      expect(response.status).toBe(401);
      expect((await response.json()).error.code).toBe('AGENT_AUTH_INVALID');
    });

    it('rejects a malformed frame without executing anything', async () => {
      const body = await (await rpc({ id: 1, method: 'tools/call' })).json();

      expect(body.error.code).toBe(JSON_RPC_INVALID_REQUEST);
      expect(harness.gatewayInvoke).not.toHaveBeenCalled();
    });

    it('offers no server-initiated stream in Phase 1', async () => {
      const response = await harness.agentFetch('/v1/agent/mcp');

      expect(response.status).toBe(405);
    });
  });
});
