import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { canonicalSourceMessageIds } from './messenger-core-canonical-source-ids';
import { MessengerCoreActionsService } from './messenger-core-actions.service';
import type { TasksAccessContext } from '../../tasks/tasks-scoped-access';

const TASKS_OWN: TasksAccessContext = {
  employeeId: 'e1',
  departmentIds: [],
  viewScope: 'OWN',
};

function sourceRow() {
  return {
    id: 'src-1',
    conversationId: 'conv-src',
    senderId: 'e1',
    senderNameSnapshot: 'Ada',
    content: 'full canonical source body',
    direction: 'INTERNAL' as const,
    status: 'SENT' as const,
    provenance: 'EMPLOYEE' as const,
    replyToMessageId: null,
    threadRootMessageId: null,
    createdAt: new Date(),
    editedAt: null,
    deletedAt: null,
    attachments: [],
    mentions: [],
    referencesAsTarget: [],
    conversation: { zone: 'INTERNAL' as const, type: 'INTERNAL_GROUP' as const },
  };
}

function holderRow() {
  return {
    ...sourceRow(),
    id: 'hold-1',
    conversationId: 'conv-target',
    content: 'full canonical source body'.slice(0, 140),
    conversation: { zone: 'INTERNAL' as const, type: 'INTERNAL_GROUP' as const },
    referencesAsTarget: [
      {
        id: 'ref-1',
        purpose: 'FORWARD' as const,
        sourceMessageId: 'src-1',
        sourceConversationId: 'conv-src',
        sortOrder: 0,
        entityType: null,
        entityId: null,
      },
    ],
  };
}

describe('FINDING-S6-01 canonical source ids', () => {
  it('resolves FORWARD sourceMessageIds, not the holder id', () => {
    const ids = canonicalSourceMessageIds({
      id: 'hold-1',
      references: [
        { purpose: 'FORWARD', sourceMessageId: 'src-b', sortOrder: 1 },
        { purpose: 'FORWARD', sourceMessageId: 'src-a', sortOrder: 0 },
      ],
    });
    expect(ids).toEqual(['src-a', 'src-b']);
    expect(ids).not.toContain('hold-1');
  });
});

describe('FINDING-S6-01 open original GET', () => {
  const prisma = {
    messengerMessage: { findUnique: vi.fn(), findMany: vi.fn(), delete: vi.fn() },
    messengerMessageReference: { findUnique: vi.fn(), create: vi.fn(), delete: vi.fn() },
    task: { findUnique: vi.fn(), findFirst: vi.fn() },
    employeeDepartment: { findMany: vi.fn() },
  };
  const core = {
    requireRead: vi.fn(),
    requireWrite: vi.fn(),
    requireEditAccess: vi.fn(),
  };
  const gateway = { emitCoreConversationMessage: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.messengerMessage.findUnique = vi
      .fn()
      .mockImplementation(async (args: { where: { id: string } }) => {
        if (args.where.id === 'src-1') return sourceRow();
        if (args.where.id === 'hold-1') return holderRow();
        return null;
      });
  });

  it('404s GET of sourceMessageId when the caller can READ the target but not the source', async () => {
    core.requireRead.mockImplementation(async (conversationId: string) => {
      if (conversationId === 'conv-target') return;
      throw new NotFoundException('Conversation not found');
    });
    const service = new MessengerCoreActionsService(
      prisma as never,
      core as never,
      gateway as never,
    );
    await expect(service.getSourceMessage('e1', 'hold-1')).resolves.toMatchObject({
      id: 'hold-1',
      conversationId: 'conv-target',
    });
    await expect(service.getSourceMessage('e1', 'src-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns the source conversation id for an allowed caller', async () => {
    core.requireRead.mockResolvedValue(undefined);
    const service = new MessengerCoreActionsService(
      prisma as never,
      core as never,
      gateway as never,
    );
    const source = await service.getSourceMessage('e1', 'src-1');
    expect(source.conversationId).toBe('conv-src');
    expect(source.conversationId).not.toBe('conv-target');
    expect(source.content).toBe('full canonical source body');
    expect(core.requireRead).toHaveBeenCalledWith('conv-src', 'e1');
  });
});

describe('FINDING-S6-02 TASK_SOURCE Task access', () => {
  const prisma = {
    messengerMessage: { findUnique: vi.fn(), findMany: vi.fn(), delete: vi.fn() },
    messengerMessageReference: { findUnique: vi.fn(), create: vi.fn(), delete: vi.fn() },
    task: { findUnique: vi.fn(), findFirst: vi.fn() },
    employeeDepartment: { findMany: vi.fn().mockResolvedValue([]) },
  };
  const core = {
    requireRead: vi.fn(),
    requireWrite: vi.fn(),
    requireEditAccess: vi.fn(),
  };
  const gateway = { emitCoreConversationMessage: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    core.requireEditAccess.mockResolvedValue(undefined);
    core.requireRead.mockResolvedValue(undefined);
  });

  it('404s attach to a Task the caller cannot open and creates no reference', async () => {
    prisma.task.findFirst = vi.fn().mockResolvedValue(null);
    prisma.task.findUnique = vi.fn();
    prisma.messengerMessage.findMany = vi.fn();
    prisma.messengerMessageReference.create = vi.fn();
    const service = new MessengerCoreActionsService(
      prisma as never,
      core as never,
      gateway as never,
    );
    await expect(
      service.attachTaskSources('e1', ['src-1'], 'task-secret', TASKS_OWN),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.messengerMessageReference.create).not.toHaveBeenCalled();
    expect(prisma.messengerMessage.delete).not.toHaveBeenCalled();
    expect(prisma.messengerMessage.findMany).not.toHaveBeenCalled();
  });

  it('404s delete of TASK_SOURCE without Task access and leaves the source message', async () => {
    prisma.messengerMessageReference.findUnique = vi.fn().mockResolvedValue({
      sourceMessageId: 'src-1',
      targetConversationId: null,
      purpose: 'TASK_SOURCE',
      entityType: 'TASK',
      entityId: 'task-secret',
    });
    prisma.messengerMessageReference.delete = vi.fn();
    prisma.task.findFirst = vi.fn().mockResolvedValue(null);
    const service = new MessengerCoreActionsService(
      prisma as never,
      core as never,
      gateway as never,
    );
    await expect(service.deleteReference('e1', 'ref-1', TASKS_OWN)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.messengerMessageReference.delete).not.toHaveBeenCalled();
    expect(prisma.messengerMessage.delete).not.toHaveBeenCalled();
  });
});
