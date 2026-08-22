import { beforeEach, describe, expect, it } from 'vitest';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { AgentAccessException } from '../auth/agent-auth.errors';
import { AGENT_IDEMPOTENCY_TTL_MS } from './agent-capability.constants';
import { AgentIdempotencyService } from './agent-idempotency.service';

const KEY = {
  agentId: 'agent-1',
  capabilityKey: 'tasks.create',
  operationKey: 'op-1',
  requestFingerprint: 'abc',
};

describe('AgentIdempotencyService', () => {
  let prisma: MockPrisma;
  let service: AgentIdempotencyService;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new AgentIdempotencyService(prisma as never);
  });

  it('reserves a new key and replays a completed result', async () => {
    prisma.externalAgentIdempotencyRecord.findUnique.mockResolvedValueOnce(null);
    prisma.externalAgentIdempotencyRecord.create.mockResolvedValue({});
    await expect(service.reserve(KEY)).resolves.toBeNull();

    prisma.externalAgentIdempotencyRecord.findUnique.mockResolvedValue({
      id: 'row-1',
      requestFingerprint: KEY.requestFingerprint,
      status: 'COMPLETED',
      responseJson: { capabilityKey: 'tasks.create', data: { id: 'task-1' } },
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + AGENT_IDEMPOTENCY_TTL_MS),
    });
    await expect(service.reserve(KEY)).resolves.toEqual({
      capabilityKey: 'tasks.create',
      data: { id: 'task-1' },
    });
  });

  it('rejects a reused key with a different fingerprint', async () => {
    prisma.externalAgentIdempotencyRecord.findUnique.mockResolvedValue({
      id: 'row-1',
      requestFingerprint: 'other',
      status: 'COMPLETED',
      responseJson: { capabilityKey: 'tasks.create', data: {} },
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + AGENT_IDEMPOTENCY_TTL_MS),
    });
    await expect(service.reserve(KEY)).rejects.toMatchObject({
      code: 'AGENT_IDEMPOTENCY_CONFLICT',
    });
  });

  it('aborts only IN_PROGRESS rows so a failed write can be retried', async () => {
    await service.abort(KEY);
    expect(prisma.externalAgentIdempotencyRecord.deleteMany).toHaveBeenCalledWith({
      where: {
        agentId: KEY.agentId,
        capabilityKey: KEY.capabilityKey,
        operationKey: KEY.operationKey,
        status: 'IN_PROGRESS',
      },
    });
  });

  it('treats a live IN_PROGRESS reservation as a conflict', async () => {
    prisma.externalAgentIdempotencyRecord.findUnique.mockResolvedValue({
      id: 'row-1',
      requestFingerprint: KEY.requestFingerprint,
      status: 'IN_PROGRESS',
      responseJson: null,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + AGENT_IDEMPOTENCY_TTL_MS),
    });
    await expect(service.reserve(KEY)).rejects.toBeInstanceOf(AgentAccessException);
  });

  it('does not reclaim a stale IN_PROGRESS row as a new reservation', async () => {
    prisma.externalAgentIdempotencyRecord.findUnique.mockResolvedValue({
      id: 'row-1',
      requestFingerprint: KEY.requestFingerprint,
      status: 'IN_PROGRESS',
      responseJson: null,
      createdAt: new Date(Date.now() - 120_000),
      expiresAt: new Date(Date.now() + AGENT_IDEMPOTENCY_TTL_MS),
    });
    await expect(service.reserve(KEY)).rejects.toMatchObject({ code: 'AGENT_CONFLICT' });
    expect(prisma.externalAgentIdempotencyRecord.create).not.toHaveBeenCalled();
    expect(prisma.externalAgentIdempotencyRecord.delete).not.toHaveBeenCalled();
  });

  it('replays an IN_PROGRESS row that already checkpointed the domain result', async () => {
    prisma.externalAgentIdempotencyRecord.findUnique.mockResolvedValue({
      id: 'row-1',
      requestFingerprint: KEY.requestFingerprint,
      status: 'IN_PROGRESS',
      responseJson: { capabilityKey: 'tasks.create', data: { id: 'task-1' } },
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + AGENT_IDEMPOTENCY_TTL_MS),
    });
    prisma.externalAgentIdempotencyRecord.update.mockResolvedValue({});

    await expect(service.reserve(KEY)).resolves.toEqual({
      capabilityKey: 'tasks.create',
      data: { id: 'task-1' },
    });
    expect(prisma.externalAgentIdempotencyRecord.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'COMPLETED' }),
      }),
    );
  });
});
