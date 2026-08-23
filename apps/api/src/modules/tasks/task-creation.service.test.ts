import { describe, expect, it, beforeEach } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { TASK_INCLUDE } from './task-response-includes';
import { automationTaskCreationActor, supportTaskCreationActor } from './task-creation-actors';
import { TaskCreationService } from './task-creation.service';

describe('TaskCreationService', () => {
  let service: TaskCreationService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    prisma.$queryRaw.mockResolvedValue([{ next_value: 12 }]);
    prisma.task.create.mockResolvedValue({ id: '1', code: 'T-2026-0012' });
    service = new TaskCreationService(prisma as never);
  });

  it('creates a human task without actor provenance', async () => {
    await service.create({ title: 'Human task', creatorId: 'emp-1' });

    const data = prisma.task.create.mock.calls[0]?.[0].data as Record<string, unknown>;
    expect(data.code).toBe(`T-${new Date().getFullYear()}-0012`);
    expect(data.createdByActorType).toBeUndefined();
    expect(data.createdByActorId).toBeUndefined();
    expect(prisma.task.create).toHaveBeenCalledWith(
      expect.objectContaining({ include: TASK_INCLUDE }),
    );
  });

  it('records Support producer provenance without inventing an employee actor', async () => {
    await service.create(
      {
        title: '[TKT-1] Fix',
        creatorId: 'emp-1',
        links: [{ entityType: 'SUPPORT_TICKET', entityId: 'ticket-1' }],
      },
      { actor: supportTaskCreationActor('ticket-1') },
    );

    expect(prisma.task.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          createdByActorType: 'SYSTEM',
          createdByActorId: 'support:ticket-1',
          creatorId: 'emp-1',
        }),
      }),
    );
  });

  it('records Automation producer provenance and the product FK', async () => {
    await service.create(
      {
        title: 'Setup project repo',
        creatorId: 'emp-1',
        productId: 'product-1',
        priority: 'NORMAL',
        links: [{ entityType: 'PRODUCT', entityId: 'product-1' }],
      },
      { actor: automationTaskCreationActor('PRODUCT', 'product-1') },
    );

    expect(prisma.task.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          productId: 'product-1',
          createdByActorType: 'AUTOMATION',
          createdByActorId: 'auto-tasks:PRODUCT:product-1',
        }),
      }),
    );
  });

  it('writes a pre-reserved code without touching the counter again', async () => {
    const tx = createMockPrisma();
    tx.task.create.mockResolvedValue({ id: '1', code: 'unused' });

    await service.create(
      { title: 'Reserved', creatorId: 'emp-1' },
      { tx: tx as never, reservedCode: 'T-2026-0009' },
    );

    expect(prisma.$queryRaw).not.toHaveBeenCalled();
    const data = tx.task.create.mock.calls[0]?.[0].data as Record<string, unknown>;
    expect(data.code).toBe('T-2026-0009');
    expect(prisma.task.create).not.toHaveBeenCalled();
  });

  it('reserves the code on the committed client when create runs inside a transaction', async () => {
    const tx = createMockPrisma();
    tx.task.create.mockResolvedValue({ id: '1', code: 'unused' });

    await service.create({ title: 'In tx', creatorId: 'emp-1' }, { tx: tx as never });

    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
    expect(tx.$queryRaw).not.toHaveBeenCalled();
    const data = tx.task.create.mock.calls[0]?.[0].data as Record<string, unknown>;
    expect(data.code).toBe(`T-${new Date().getFullYear()}-0012`);
  });

  it('rejects an empty title before allocating a code', async () => {
    await expect(service.create({ title: '  ', creatorId: 'emp-1' })).rejects.toThrow(
      BadRequestException,
    );
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
    expect(prisma.task.create).not.toHaveBeenCalled();
  });
});
