import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MessengerCoreService } from './messenger-core.service';
import { requireTaskConversationAccess } from './messenger-core-task-access.ops';

const loadMessengerLegacyAccess = vi.fn();

vi.mock('../access/messenger-legacy-channel-access.op', () => ({
  loadMessengerLegacyAccess: (...args: unknown[]) => loadMessengerLegacyAccess(...args),
}));

vi.mock('../messenger-attachment-access.op', () => ({
  assertMessengerFileAssetsAttachable: vi.fn(
    async (_prisma: unknown, _access: unknown, ids: string[]) => ids,
  ),
}));

const ACCESS_MESSENGER_ALL = {
  employeeId: 'outsider',
  departmentIds: [],
  viewScope: 'ALL' as const,
  editScope: 'ALL' as const,
  clientReadScope: 'NONE' as const,
  clientSendScope: 'NONE' as const,
  tasksViewScope: 'OWN',
};

describe('Task conversation GET ACL', () => {
  beforeEach(() => {
    loadMessengerLegacyAccess.mockReset().mockResolvedValue(ACCESS_MESSENGER_ALL);
  });

  it('404s Messenger GET by id when MESSENGER.VIEW ALL lacks Task access', async () => {
    const prisma = {
      employee: { findUnique: vi.fn() },
      messengerConversation: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'conv-task',
          zone: 'INTERNAL',
          type: 'TASK',
          title: 'Fix',
          status: 'ACTIVE',
          canonicalKey: 'task:task-1',
          createdAt: new Date(),
          lastMessageAt: null,
        }),
      },
      messengerConversationParticipant: { findFirst: vi.fn().mockResolvedValue(null) },
      resourceAccessGrant: { findFirst: vi.fn().mockResolvedValue(null) },
      messengerConversationLink: {
        findFirst: vi.fn().mockResolvedValue({ entityId: 'task-1' }),
      },
      task: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'task-1',
          title: 'Fix',
          creatorId: 'owner',
          assigneeId: null,
          reviewerId: null,
          coAssignees: [],
          observers: [],
          trashedAt: null,
        }),
        findFirst: vi.fn().mockResolvedValue(null),
      },
      employeeDepartment: { findMany: vi.fn().mockResolvedValue([]) },
      messengerConversationParticipantCreateMany: { createMany: vi.fn() },
    };
    const service = new MessengerCoreService(
      prisma as never,
      { emitCoreConversationMessage: vi.fn(), emitReadListsUpdated: vi.fn() } as never,
      { log: vi.fn() } as never,
    );
    await expect(service.getConversation('conv-task', 'outsider')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.task.findFirst).toHaveBeenCalled();
  });

  it('allows TASKS.VIEW ALL to read a Task conversation they can open in Tasks', async () => {
    loadMessengerLegacyAccess.mockResolvedValue({
      ...ACCESS_MESSENGER_ALL,
      tasksViewScope: 'ALL',
    });
    const prisma = {
      employee: { findUnique: vi.fn() },
      messengerConversation: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'conv-task',
          zone: 'INTERNAL',
          type: 'TASK',
          title: 'Fix',
          status: 'ACTIVE',
          canonicalKey: 'task:task-1',
          createdAt: new Date(),
          lastMessageAt: null,
        }),
      },
      messengerConversationParticipant: { findFirst: vi.fn().mockResolvedValue(null) },
      resourceAccessGrant: { findFirst: vi.fn().mockResolvedValue(null) },
      messengerConversationLink: {
        findFirst: vi.fn().mockResolvedValue({ entityId: 'task-1' }),
      },
      task: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'task-1',
          title: 'Fix',
          creatorId: 'owner',
          assigneeId: null,
          reviewerId: null,
          coAssignees: [],
          observers: [],
          trashedAt: null,
        }),
        findFirst: vi.fn().mockResolvedValue({ id: 'task-1' }),
      },
      employeeDepartment: { findMany: vi.fn().mockResolvedValue([]) },
    };
    const service = new MessengerCoreService(
      prisma as never,
      { emitCoreConversationMessage: vi.fn(), emitReadListsUpdated: vi.fn() } as never,
      { log: vi.fn() } as never,
    );
    await expect(service.getConversation('conv-task', 'admin')).resolves.toEqual(
      expect.objectContaining({ id: 'conv-task', type: 'TASK' }),
    );
    expect(prisma.task.findFirst).not.toHaveBeenCalled();
  });
});

describe('requireTaskConversationAccess', () => {
  it('404s when the TASK PRIMARY link is missing', async () => {
    const prisma = {
      messengerConversationLink: { findFirst: vi.fn().mockResolvedValue(null) },
      task: { findUnique: vi.fn(), findFirst: vi.fn() },
    };
    await expect(
      requireTaskConversationAccess(prisma as never, 'conv-x', {
        employeeId: 'e1',
        departmentIds: [],
        viewScope: 'OWN',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.task.findUnique).not.toHaveBeenCalled();
  });
});
