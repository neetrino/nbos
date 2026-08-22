import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authenticatedAgentFixture } from '../../../test-utils/authenticated-agent';
import { AgentAccessException } from '../auth/agent-auth.errors';
import type { AgentCapabilityGateway } from '../gateway/agent-capability.gateway';
import { AgentRateLimitService } from '../limits/agent-rate-limit.service';
import { AgentProtocolInvoker } from './agent-protocol.invoker';

describe('AgentProtocolInvoker', () => {
  let invoke: ReturnType<typeof vi.fn>;
  let invoker: AgentProtocolInvoker;

  beforeEach(() => {
    invoke = vi.fn().mockResolvedValue({ capabilityKey: 'tasks.read', data: { id: 'task-1' } });
    invoker = new AgentProtocolInvoker(
      { invoke } as unknown as AgentCapabilityGateway,
      new AgentRateLimitService(),
    );
  });

  it('routes an operation to its catalog capability', async () => {
    await invoker.invoke({
      agent: authenticatedAgentFixture(),
      operationId: 'tasks.get',
      input: { taskId: 'task-1' },
    });

    expect(invoke).toHaveBeenCalledWith(
      expect.objectContaining({ capabilityKey: 'tasks.read', input: { taskId: 'task-1' } }),
    );
  });

  it('passes the protocol idempotency key into the gateway invocation', async () => {
    await invoker.invoke({
      agent: authenticatedAgentFixture(),
      operationId: 'tasks.create',
      input: { workspaceId: 'ws-1', title: 'T' },
      idempotencyKey: 'op-1',
    });

    expect(invoke).toHaveBeenCalledWith(expect.objectContaining({ idempotencyKey: 'op-1' }));
  });

  it('drops omitted query parameters instead of sending explicit undefined', async () => {
    await invoker.invoke({
      agent: authenticatedAgentFixture(),
      operationId: 'tasks.list',
      input: { workspaceId: 'ws-1', status: undefined, page: undefined },
    });

    expect(invoke.mock.calls[0][0].input).toEqual({ workspaceId: 'ws-1' });
  });

  it('carries artifact bytes as a binary payload, never as a JSON field', async () => {
    await invoker.invoke({
      agent: authenticatedAgentFixture(),
      operationId: 'artifacts.attach',
      input: { taskId: 'task-1', fileName: 'a.txt', mimeType: 'text/plain', sizeBytes: 3 },
      idempotencyKey: 'op-2',
      contentBase64: Buffer.from('abc').toString('base64'),
    });

    const invocation = invoke.mock.calls[0][0];
    expect(Buffer.from(invocation.payload.bytes).toString('utf8')).toBe('abc');
    expect(invocation.input).not.toHaveProperty('contentBase64');
    expect(JSON.stringify(invocation.input)).not.toContain('abc');
  });

  it('sends no payload for a non-binary operation', async () => {
    await invoker.invoke({
      agent: authenticatedAgentFixture(),
      operationId: 'tasks.comment',
      input: { taskId: 'task-1', body: 'done' },
      idempotencyKey: 'op-3',
    });

    expect(invoke.mock.calls[0][0].payload).toBeNull();
  });

  it('rejects an attach without content before reaching the gateway', async () => {
    await expect(
      invoker.invoke({
        agent: authenticatedAgentFixture(),
        operationId: 'artifacts.attach',
        input: { taskId: 'task-1' },
        idempotencyKey: 'op-4',
      }),
    ).rejects.toBeInstanceOf(AgentAccessException);
    expect(invoke).not.toHaveBeenCalled();
  });

  it('answers identity from the authenticated actor without touching the gateway', async () => {
    const body = await invoker.invoke({
      agent: authenticatedAgentFixture(),
      operationId: 'identity.read',
      input: {},
    });

    expect(invoke).not.toHaveBeenCalled();
    expect(body.data).toMatchObject({ agentId: 'agent-1', actorType: 'EXTERNAL_AGENT' });
    expect(JSON.stringify(body)).not.toContain('capabilit');
  });

  it('returns the gateway result in the contract envelope', async () => {
    invoke.mockResolvedValue({
      capabilityKey: 'tasks.list',
      data: { items: [{ id: 'task-1' }], meta: { page: 1, pageSize: 20, total: 1 } },
    });

    const body = await invoker.invoke({
      agent: authenticatedAgentFixture(),
      operationId: 'tasks.list',
      input: { workspaceId: 'ws-1' },
    });

    expect(body).toEqual({
      data: [{ id: 'task-1' }],
      meta: { page: 1, pageSize: 20, total: 1 },
    });
  });

  it('lets a gateway denial through unchanged', async () => {
    invoke.mockRejectedValue(AgentAccessException.fromDenyReason('CAPABILITY_NOT_GRANTED'));

    await expect(
      invoker.invoke({
        agent: authenticatedAgentFixture(),
        operationId: 'tasks.create',
        input: { workspaceId: 'ws-1', title: 'T' },
        idempotencyKey: 'op-5',
      }),
    ).rejects.toMatchObject({ code: 'AGENT_CAPABILITY_DENIED' });
  });
});
