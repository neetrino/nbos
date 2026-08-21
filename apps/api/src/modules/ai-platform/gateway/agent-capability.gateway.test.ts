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
  };
  let audit: { logMachineAction: ReturnType<typeof vi.fn> };
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
      update: vi.fn(),
      start: vi.fn(),
      comment: vi.fn(),
      submitReview: vi.fn(),
    };
    drive = {
      readTaskArtifact: vi.fn(),
      attachArtifact: vi.fn().mockResolvedValue({ fileAssetId: 'file-1', linkId: 'link-1' }),
    };
    idempotency = {
      reserve: vi.fn().mockResolvedValue(null),
      complete: vi.fn(),
      abort: vi.fn(),
    };
    audit = { logMachineAction: vi.fn().mockResolvedValue(undefined) };
    gateway = new AgentCapabilityGateway(
      workspaces as never,
      taskReads as never,
      taskWrites as never,
      drive as never,
      idempotency as never,
      audit as never,
    );
  });

  it('routes workspaces.read through the workspace handler, not Prisma', async () => {
    await gateway.invoke(invocation('workspaces.read', {}));
    expect(workspaces.read).toHaveBeenCalled();
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
    expect(taskWrites.create).not.toHaveBeenCalled();
    expect(idempotency.complete).not.toHaveBeenCalled();
  });

  it('audits a successful write after the domain call', async () => {
    await gateway.invoke(
      invocation('tasks.create', { workspaceId: 'ws-1', title: 'Fix' }, { idempotencyKey: 'op-1' }),
    );
    expect(taskWrites.create).toHaveBeenCalled();
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

  it('releases an in-progress reservation when the domain call fails', async () => {
    taskWrites.create.mockRejectedValue(new Error('domain failed'));
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
      workspaces as never,
      taskReads as never,
      taskWrites as never,
      drive as never,
      realIdempotency,
      audit as never,
    );

    await expect(
      retryGateway.invoke(
        invocation('tasks.create', input, { idempotencyKey: 'op-complete-fail' }),
      ),
    ).rejects.toThrow('complete failed');
    expect(prisma.externalAgentIdempotencyRecord.deleteMany).not.toHaveBeenCalled();
    expect(taskWrites.create).toHaveBeenCalledTimes(1);
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
    expect(taskWrites.create).toHaveBeenCalledTimes(1);
  });
});
