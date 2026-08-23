import { beforeEach, describe, expect, it, vi } from 'vitest';
import { actorContextFromMachine } from '@nbos/shared';
import { createMockPrisma } from '../../../test-utils/mock-prisma';
import { AgentAccessException } from '../auth/agent-auth.errors';
import type { AuthenticatedAgent } from '../auth/agent-authenticator.service';
import { AgentCapabilityGateway } from './agent-capability.gateway';
import { AGENT_IDEMPOTENCY_TTL_MS } from './agent-capability.constants';
import { pickCapabilityInput, requireCapability } from './agent-capability.input';
import type { AgentCapabilityInvocation } from './agent-capability.types';
import { fingerprintCapabilityRequest } from './agent-idempotency.rules';
import { AgentIdempotencyService } from './agent-idempotency.service';
import { toAgentResponseBody } from '../protocol/agent-response.envelope';

function agent(): AuthenticatedAgent {
  return {
    agentId: 'agent-1',
    agentName: 'Cursor Agent',
    agentState: 'ACTIVE',
    credentialId: 'cred-1',
    credentialKeyId: 'aabbccddeeff001122',
    credentialState: 'ACTIVE',
    actor: actorContextFromMachine({
      id: 'agent-1',
      type: 'EXTERNAL_AGENT',
      displayName: 'Cursor Agent',
    }),
  };
}

function invocation(
  capabilityKey: string,
  input: Record<string, unknown>,
  extra: Partial<AgentCapabilityInvocation> = {},
): AgentCapabilityInvocation {
  return { agent: agent(), capabilityKey, input, ...extra };
}

describe('AgentCapabilityGateway', () => {
  let workspaces: { read: ReturnType<typeof vi.fn> };
  let taskReads: Record<string, ReturnType<typeof vi.fn>>;
  let taskWrites: Record<string, ReturnType<typeof vi.fn>>;
  let drive: Record<string, ReturnType<typeof vi.fn>>;
  let idempotency: {
    reserve: ReturnType<typeof vi.fn>;
    complete: ReturnType<typeof vi.fn>;
    abort: ReturnType<typeof vi.fn>;
    checkpointCommittedResult: ReturnType<typeof vi.fn>;
  };
  let audit: { logMachineAction: ReturnType<typeof vi.fn> };
  let replayAuthorization: { assertStillAuthorized: ReturnType<typeof vi.fn> };
  let gatewayPrisma: ReturnType<typeof createMockPrisma>;
  let gateway: AgentCapabilityGateway;

  beforeEach(() => {
    workspaces = { read: vi.fn().mockResolvedValue({ id: 'ws-1' }) };
    taskReads = {
      list: vi.fn(),
      read: vi.fn().mockResolvedValue({ id: 'task-1' }),
      readLinks: vi.fn(),
      readDiscussion: vi.fn(),
    };
    taskWrites = {
      create: vi.fn().mockResolvedValue({ id: 'task-1', code: 'T-2026-1' }),
      prepareCreate: vi.fn().mockResolvedValue({
        title: 'Fix',
        workspaceId: 'ws-1',
        creatorId: 'owner-1',
        actor: { type: 'EXTERNAL_AGENT', id: 'agent-1' },
      }),
      commitPreparedCreate: vi.fn().mockResolvedValue({ id: 'task-1', code: 'T-2026-1' }),
      update: vi.fn(),
      start: vi.fn(),
      comment: vi.fn(),
      submitReview: vi.fn(),
      reserveCreateCode: vi.fn().mockResolvedValue('T-2026-0001'),
    };
    drive = {
      readTaskArtifact: vi.fn(),
      attachArtifact: vi.fn().mockResolvedValue({ fileAssetId: 'file-1', linkId: 'link-1' }),
    };
    idempotency = {
      reserve: vi.fn().mockResolvedValue(null),
      complete: vi.fn(),
      abort: vi.fn(),
      checkpointCommittedResult: vi.fn().mockResolvedValue(undefined),
    };
    audit = { logMachineAction: vi.fn().mockResolvedValue(undefined) };
    replayAuthorization = { assertStillAuthorized: vi.fn().mockResolvedValue(undefined) };
    gatewayPrisma = createMockPrisma();
    gateway = new AgentCapabilityGateway(
      gatewayPrisma as never,
      workspaces as never,
      taskReads as never,
      taskWrites as never,
      drive as never,
      idempotency as never,
      replayAuthorization as never,
      audit as never,
    );
  });

  it('routes workspaces.read through the workspace handler, not Prisma', async () => {
    await gateway.invoke(invocation('workspaces.read', {}));
    expect(workspaces.read).toHaveBeenCalled();
  });

  it('strips undeclared fields from a capability projection', async () => {
    taskReads.read.mockResolvedValue({
      id: 'task-1',
      code: 'T-1',
      title: 'A',
      description: null,
      status: 'OPEN',
      priority: 'NORMAL',
      dueDate: null,
      workspaceId: 'ws-1',
      sprintId: null,
      updatedAt: '2026-08-22T00:00:00.000Z',
      secretNotes: 'nope',
    });
    const result = await gateway.invoke(invocation('tasks.read', { taskId: 'task-1' }));
    expect(result.data).toMatchObject({ id: 'task-1', code: 'T-1' });
    expect(result.data).not.toHaveProperty('secretNotes');
  });

  it('keeps list meta so the 09 envelope stays { data, meta }', async () => {
    taskReads.list.mockResolvedValue({
      items: [{ id: 't1', code: 'T-1', title: 'A', extra: true }],
      meta: { page: 1, pageSize: 20, total: 1 },
    });
    const result = await gateway.invoke(invocation('tasks.list', { workspaceId: 'ws-1' }));
    const data = result.data as { items: Array<Record<string, unknown>>; meta: unknown };
    expect(data.meta).toEqual({ page: 1, pageSize: 20, total: 1 });
    expect(data).not.toHaveProperty('page');
    const first = data.items[0];
    expect(first).toBeDefined();
    expect(first).not.toHaveProperty('extra');
    expect(toAgentResponseBody(result.data)).toEqual({
      data: [expect.objectContaining({ id: 't1', code: 'T-1' })],
      meta: { page: 1, pageSize: 20, total: 1 },
    });
  });

  it('rejects unregistered delete and force-complete capabilities', async () => {
    await expect(
      gateway.invoke(invocation('tasks.delete', { taskId: 't1' })),
    ).rejects.toBeInstanceOf(AgentAccessException);
    await expect(
      gateway.invoke(invocation('tasks.force_complete', { taskId: 't1' })),
    ).rejects.toBeInstanceOf(AgentAccessException);
    expect(taskWrites.create).not.toHaveBeenCalled();
  });

  it('rejects unknown input fields instead of forwarding them to Tasks', async () => {
    await expect(
      gateway.invoke(
        invocation('tasks.update', { taskId: 't1', status: 'COMPLETED' }, { idempotencyKey: 'k1' }),
      ),
    ).rejects.toMatchObject({ code: 'AGENT_VALIDATION_FAILED' });
    expect(taskWrites.update).not.toHaveBeenCalled();
  });

  it('requires an idempotency key for tasks.create', async () => {
    await expect(
      gateway.invoke(invocation('tasks.create', { workspaceId: 'ws-1', title: 'Fix' })),
    ).rejects.toMatchObject({ code: 'AGENT_VALIDATION_FAILED' });
    expect(taskWrites.create).not.toHaveBeenCalled();
  });

  it('replays a stored idempotent create instead of calling Tasks again', async () => {
    const stored = { capabilityKey: 'tasks.create', data: { id: 'task-1' } };
    idempotency.reserve.mockResolvedValue(stored);

    const result = await gateway.invoke(
      invocation(
        'tasks.create',
        { workspaceId: 'ws-1', title: 'Fix' },
        { idempotencyKey: 'retry-1' },
      ),
    );

    expect(result).toEqual(stored);
    expect(taskWrites.prepareCreate).not.toHaveBeenCalled();
    expect(taskWrites.commitPreparedCreate).not.toHaveBeenCalled();
    expect(idempotency.complete).not.toHaveBeenCalled();
  });

  it('revalidates the actor and grant before answering from a stored replay', async () => {
    idempotency.reserve.mockResolvedValue({
      capabilityKey: 'tasks.create',
      data: { id: 'task-1' },
    });

    await gateway.invoke(
      invocation(
        'tasks.create',
        { workspaceId: 'ws-1', title: 'Fix' },
        { idempotencyKey: 'retry-1' },
      ),
    );

    expect(replayAuthorization.assertStillAuthorized).toHaveBeenCalledWith(
      expect.objectContaining({ agentId: 'agent-1' }),
      expect.objectContaining({ key: 'tasks.create' }),
      { workspaceId: 'ws-1', title: 'Fix' },
    );
  });

  it('refuses a replay once the capability grant is revoked', async () => {
    idempotency.reserve.mockResolvedValue({
      capabilityKey: 'tasks.create',
      data: { id: 'task-1' },
    });
    replayAuthorization.assertStillAuthorized.mockRejectedValue(
      AgentAccessException.fromDenyReason('CAPABILITY_NOT_GRANTED'),
    );

    await expect(
      gateway.invoke(
        invocation(
          'tasks.create',
          { workspaceId: 'ws-1', title: 'Fix' },
          { idempotencyKey: 'retry-1' },
        ),
      ),
    ).rejects.toBeInstanceOf(AgentAccessException);
  });

  it('audits a successful write after the domain call', async () => {
    await gateway.invoke(
      invocation('tasks.create', { workspaceId: 'ws-1', title: 'Fix' }, { idempotencyKey: 'op-1' }),
    );
    expect(taskWrites.commitPreparedCreate).toHaveBeenCalled();
    expect(idempotency.checkpointCommittedResult).toHaveBeenCalled();
    expect(idempotency.complete).toHaveBeenCalled();
    expect(audit.logMachineAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'AGENT_CAPABILITY_INVOKED',
        changes: expect.objectContaining({ capabilityKey: 'tasks.create' }),
      }),
    );
  });

  it('does not audit successful ON_DENY reads', async () => {
    await gateway.invoke(invocation('tasks.read', { taskId: 'task-1' }));
    expect(audit.logMachineAction).not.toHaveBeenCalled();
  });

  it('requires artifact bytes for attach', async () => {
    await expect(
      gateway.invoke(
        invocation(
          'tasks.attach_artifact',
          { taskId: 't1', fileName: 'a.zip', mimeType: 'application/zip', sizeBytes: 1 },
          { idempotencyKey: 'att-1' },
        ),
      ),
    ).rejects.toMatchObject({ code: 'AGENT_VALIDATION_FAILED' });
    expect(idempotency.abort).toHaveBeenCalled();
  });

  it('accepts clientOperationId as the MCP idempotency key', async () => {
    await gateway.invoke(
      invocation('tasks.create', {
        workspaceId: 'ws-1',
        title: 'Fix',
        clientOperationId: 'mcp-op-1',
      }),
    );
    expect(idempotency.reserve).toHaveBeenCalledWith(
      expect.objectContaining({ operationKey: 'mcp-op-1' }),
    );
  });

  it('authorizes and reserves a Task code before opening the task+checkpoint transaction', async () => {
    const order: string[] = [];
    taskWrites.prepareCreate.mockImplementation(async () => {
      order.push('prepare');
      return {
        title: 'Fix',
        workspaceId: 'ws-1',
        creatorId: 'owner-1',
        actor: { type: 'EXTERNAL_AGENT', id: 'agent-1' },
      };
    });
    taskWrites.reserveCreateCode.mockImplementation(async () => {
      order.push('reserve');
      return 'T-2026-0001';
    });
    gatewayPrisma.$transaction.mockImplementation(async (arg: unknown) => {
      order.push('tx');
      if (typeof arg === 'function') {
        return (arg as (tx: typeof gatewayPrisma) => Promise<unknown>)(gatewayPrisma);
      }
      return undefined;
    });

    await gateway.invoke(
      invocation(
        'tasks.create',
        { workspaceId: 'ws-1', title: 'Fix' },
        { idempotencyKey: 'op-reserve' },
      ),
    );

    expect(order).toEqual(['prepare', 'reserve', 'tx']);
    expect(taskWrites.commitPreparedCreate).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Fix' }),
      'T-2026-0001',
      gatewayPrisma,
    );
  });

  it('hands Tasks and its idempotency checkpoint the same transaction', async () => {
    await gateway.invoke(
      invocation(
        'tasks.create',
        { workspaceId: 'ws-1', title: 'Fix' },
        { idempotencyKey: 'op-tx' },
      ),
    );

    // The mock runs the callback with itself, so both calls receiving that same
    // object is what proves they share one transaction rather than two writes.
    const dispatched = taskWrites.commitPreparedCreate.mock.calls[0]?.[2];
    const checkpointed = idempotency.checkpointCommittedResult.mock.calls[0]?.[2];
    expect(gatewayPrisma.$transaction).toHaveBeenCalled();
    expect(dispatched).toBe(gatewayPrisma);
    expect(checkpointed).toBe(gatewayPrisma);
  });

  it('leaves the operation key reusable when the checkpoint fails on a Tasks write', async () => {
    // Standing in for a crash between the task commit and its checkpoint. The
    // shared transaction turns that into a rollback, so nothing committed and
    // the reservation is released instead of pinned at 409 forever.
    idempotency.checkpointCommittedResult.mockRejectedValue(new Error('checkpoint failed'));

    await expect(
      gateway.invoke(
        invocation(
          'tasks.create',
          { workspaceId: 'ws-1', title: 'Fix' },
          { idempotencyKey: 'op-checkpoint-fail' },
        ),
      ),
    ).rejects.toThrow('checkpoint failed');

    expect(idempotency.abort).toHaveBeenCalled();
    expect(idempotency.complete).not.toHaveBeenCalled();
  });

  it('does not open a transaction for Drive, whose object write cannot join one', async () => {
    await gateway.invoke(
      invocation(
        'tasks.attach_artifact',
        { taskId: 'task-1', fileName: 'a.png', mimeType: 'image/png', sizeBytes: 3 },
        { idempotencyKey: 'op-drive', payload: { bytes: new Uint8Array([1, 2, 3]) } },
      ),
    );

    expect(gatewayPrisma.$transaction).not.toHaveBeenCalled();
    expect(idempotency.checkpointCommittedResult).toHaveBeenCalled();
  });

  it('releases an in-progress reservation when the domain call fails', async () => {
    taskWrites.commitPreparedCreate.mockRejectedValue(new Error('domain failed'));
    await expect(
      gateway.invoke(
        invocation(
          'tasks.create',
          { workspaceId: 'ws-1', title: 'Fix' },
          { idempotencyKey: 'op-fail' },
        ),
      ),
    ).rejects.toThrow('domain failed');
    expect(idempotency.complete).not.toHaveBeenCalled();
    expect(idempotency.abort).toHaveBeenCalled();
  });

  it('does not abort after domain commit if complete() fails, and retry does not create again', async () => {
    const prisma = createMockPrisma();
    const realIdempotency = new AgentIdempotencyService(prisma as never);
    const input = { workspaceId: 'ws-1', title: 'Fix' };
    const picked = pickCapabilityInput(requireCapability('tasks.create'), input);
    const requestFingerprint = fingerprintCapabilityRequest(picked);
    prisma.externalAgentIdempotencyRecord.findUnique.mockResolvedValueOnce(null);
    prisma.externalAgentIdempotencyRecord.create.mockResolvedValue({});
    prisma.externalAgentIdempotencyRecord.update.mockRejectedValue(new Error('complete failed'));

    const retryGateway = new AgentCapabilityGateway(
      prisma as never,
      workspaces as never,
      taskReads as never,
      taskWrites as never,
      drive as never,
      realIdempotency,
      replayAuthorization as never,
      audit as never,
    );

    await expect(
      retryGateway.invoke(
        invocation('tasks.create', input, { idempotencyKey: 'op-complete-fail' }),
      ),
    ).rejects.toThrow('complete failed');
    expect(prisma.externalAgentIdempotencyRecord.deleteMany).not.toHaveBeenCalled();
    expect(taskWrites.commitPreparedCreate).toHaveBeenCalledTimes(1);
    expect(audit.logMachineAction).toHaveBeenCalled();

    prisma.externalAgentIdempotencyRecord.findUnique.mockResolvedValue({
      id: 'row-1',
      requestFingerprint,
      status: 'IN_PROGRESS',
      responseJson: null,
      createdAt: new Date(Date.now() - 61_000),
      expiresAt: new Date(Date.now() + AGENT_IDEMPOTENCY_TTL_MS),
    });

    await expect(
      retryGateway.invoke(
        invocation('tasks.create', input, { idempotencyKey: 'op-complete-fail' }),
      ),
    ).rejects.toBeInstanceOf(AgentAccessException);
    expect(taskWrites.commitPreparedCreate).toHaveBeenCalledTimes(1);
  });
});
