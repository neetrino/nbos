import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authenticatedAgentFixture } from '../../../test-utils/authenticated-agent';
import { AgentAccessException } from '../auth/agent-auth.errors';
import type { AgentProtocolInvoker } from '../protocol/agent-protocol.invoker';
import {
  AGENT_MCP_DEFAULT_PROTOCOL_VERSION,
  AGENT_MCP_SERVER_INFO,
  JSON_RPC_METHOD_NOT_FOUND,
} from './agent-mcp.constants';
import { AgentMcpServer, negotiateProtocolVersion } from './agent-mcp.server';
import type { JsonRpcRequest } from './agent-mcp.jsonrpc';

function request(method: string, params: Record<string, unknown> = {}): JsonRpcRequest {
  return { id: 1, method, params };
}

function toolResult(response: unknown): Record<string, unknown> {
  return (response as { result: Record<string, unknown> }).result;
}

describe('AgentMcpServer', () => {
  let invoke: ReturnType<typeof vi.fn>;
  let server: AgentMcpServer;
  const agent = authenticatedAgentFixture({ channel: 'mcp' });

  beforeEach(() => {
    invoke = vi.fn().mockResolvedValue({ data: { id: 'task-1' } });
    server = new AgentMcpServer({ invoke } as unknown as AgentProtocolInvoker);
  });

  it('answers initialize with a supported protocol version and server info', async () => {
    const response = await server.handle(
      agent,
      request('initialize', { protocolVersion: '2025-03-26' }),
    );

    expect(toolResult(response)).toMatchObject({
      protocolVersion: '2025-03-26',
      capabilities: { tools: { listChanged: false } },
      serverInfo: AGENT_MCP_SERVER_INFO,
    });
  });

  it('negotiates an unknown client version down to a supported one', () => {
    expect(negotiateProtocolVersion('1999-01-01')).toBe(AGENT_MCP_DEFAULT_PROTOCOL_VERSION);
    expect(negotiateProtocolVersion(undefined)).toBe(AGENT_MCP_DEFAULT_PROTOCOL_VERSION);
  });

  it('states in its instructions that listing a tool is not permission', async () => {
    const response = await server.handle(agent, request('initialize'));

    expect(toolResult(response).instructions).toMatch(/authorized server-side/i);
  });

  it('returns no response for a notification', async () => {
    const response = await server.handle(agent, {
      id: null,
      method: 'notifications/initialized',
      params: {},
    });

    expect(response).toBeNull();
  });

  it('answers ping', async () => {
    expect(toolResult(await server.handle(agent, request('ping')))).toEqual({});
  });

  it('lists the tool catalog', async () => {
    const result = toolResult(await server.handle(agent, request('tools/list')));

    expect((result.tools as unknown[]).length).toBe(14);
  });

  it('rejects an unknown method with a JSON-RPC error', async () => {
    const response = await server.handle(agent, request('resources/list'));

    expect(response).toMatchObject({ error: { code: JSON_RPC_METHOD_NOT_FOUND } });
  });

  it('calls the shared invoker for a tool and returns structured content', async () => {
    const response = await server.handle(
      agent,
      request('tools/call', { name: 'nbos_get_task', arguments: { taskId: 'task-1' } }),
    );

    expect(invoke).toHaveBeenCalledWith(
      expect.objectContaining({ operationId: 'tasks.get', input: { taskId: 'task-1' } }),
    );
    expect(toolResult(response)).toMatchObject({
      isError: false,
      structuredContent: { data: { id: 'task-1' } },
    });
  });

  it('maps clientOperationId onto the gateway idempotency key', async () => {
    await server.handle(
      agent,
      request('tools/call', {
        name: 'nbos_create_task',
        arguments: { workspaceId: 'ws-1', title: 'T', clientOperationId: 'op-9' },
      }),
    );

    const invocation = invoke.mock.calls[0][0];
    expect(invocation.idempotencyKey).toBe('op-9');
    expect(invocation.input).toEqual({ workspaceId: 'ws-1', title: 'T' });
  });

  it('routes attach content to the binary payload rather than the tool input', async () => {
    await server.handle(
      agent,
      request('tools/call', {
        name: 'nbos_attach_task_artifact',
        arguments: {
          taskId: 'task-1',
          fileName: 'a.txt',
          mimeType: 'text/plain',
          sizeBytes: 3,
          contentBase64: 'YWJj',
          clientOperationId: 'op-10',
        },
      }),
    );

    const invocation = invoke.mock.calls[0][0];
    expect(invocation.contentBase64).toBe('YWJj');
    expect(invocation.input).not.toHaveProperty('contentBase64');
  });

  it('reports a denial as an isError result carrying the stable code', async () => {
    invoke.mockRejectedValue(AgentAccessException.fromDenyReason('CAPABILITY_NOT_GRANTED'));

    const result = toolResult(
      await server.handle(
        agent,
        request('tools/call', { name: 'nbos_create_task', arguments: {} }),
      ),
    );

    expect(result.isError).toBe(true);
    expect(result.structuredContent).toMatchObject({
      error: { code: 'AGENT_CAPABILITY_DENIED', requestId: 'corr-1' },
    });
  });

  it('reports a missing and an out-of-scope resource identically', async () => {
    invoke.mockRejectedValue(AgentAccessException.resourceNotAvailable());
    const missing = toolResult(
      await server.handle(
        agent,
        request('tools/call', { name: 'nbos_get_task', arguments: { taskId: 'a' } }),
      ),
    );

    invoke.mockRejectedValue(AgentAccessException.fromDenyReason('RESOURCE_OUT_OF_SCOPE'));
    const denied = toolResult(
      await server.handle(
        agent,
        request('tools/call', { name: 'nbos_get_task', arguments: { taskId: 'b' } }),
      ),
    );

    expect(denied.structuredContent).toEqual(missing.structuredContent);
  });

  it('never leaks an internal fault message to the model', async () => {
    invoke.mockRejectedValue(new Error('connect ECONNREFUSED 10.0.0.1:5432'));

    const result = toolResult(
      await server.handle(agent, request('tools/call', { name: 'nbos_get_task', arguments: {} })),
    );

    expect(JSON.stringify(result)).not.toContain('ECONNREFUSED');
    expect(result.structuredContent).toMatchObject({ error: { code: 'AGENT_INTERNAL_ERROR' } });
  });

  it('refuses an unregistered tool without calling the gateway', async () => {
    const result = toolResult(
      await server.handle(
        agent,
        request('tools/call', { name: 'nbos_delete_task', arguments: {} }),
      ),
    );

    expect(invoke).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.structuredContent).toMatchObject({ error: { code: 'AGENT_VALIDATION_FAILED' } });
  });

  it('treats missing tool arguments as an empty object rather than failing the frame', async () => {
    await server.handle(agent, request('tools/call', { name: 'nbos_list_workspaces' }));

    expect(invoke.mock.calls[0][0].input).toEqual({});
  });
});
