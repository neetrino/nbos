import { beforeEach, describe, expect, it, vi } from 'vitest';
import { messengerSocketConversationRoom } from '@nbos/shared';
import {
  leaveSocketCoreConversation,
  subscribeSocketToCoreConversation,
} from './messenger-gateway-core-subscribe';

const loadMessengerLegacyAccess = vi.fn();

vi.mock('./access/messenger-legacy-channel-access.op', () => ({
  loadMessengerLegacyAccess: (...args: unknown[]) => loadMessengerLegacyAccess(...args),
}));

function access(overrides: Record<string, unknown> = {}) {
  return {
    employeeId: 'e1',
    departmentIds: [],
    viewScope: 'OWN',
    editScope: 'OWN',
    clientReadScope: 'NONE',
    clientSendScope: 'NONE',
    tasksViewScope: 'OWN',
    ...overrides,
  };
}

function prismaMock(input: {
  conversation?: { id: string; zone: 'INTERNAL' | 'CLIENT'; type: string } | null;
  participant?: { role: string } | null;
  grant?: { level: string } | null;
  taskLink?: { entityId: string } | null;
  taskFindFirst?: { id: string } | null;
}) {
  return {
    messengerConversation: {
      findUnique: vi.fn().mockResolvedValue(input.conversation ?? null),
    },
    messengerConversationParticipant: {
      findFirst: vi.fn().mockResolvedValue(input.participant ?? null),
    },
    resourceAccessGrant: {
      findFirst: vi.fn().mockResolvedValue(input.grant ?? null),
    },
    messengerConversationLink: {
      findFirst: vi.fn().mockResolvedValue(input.taskLink ?? null),
    },
    task: {
      findUnique: vi.fn().mockResolvedValue(
        input.taskFindFirst
          ? { ...input.taskFindFirst, trashedAt: null, title: 'T', creatorId: 'e1' }
          : null,
      ),
      findFirst: vi.fn().mockResolvedValue(input.taskFindFirst ?? null),
    },
    employeeDepartment: { findMany: vi.fn().mockResolvedValue([]) },
  };
}

describe('subscribeSocketToCoreConversation', () => {
  beforeEach(() => {
    loadMessengerLegacyAccess.mockReset();
  });
  it('denies malformed bodies and never joins', async () => {
    const join = vi.fn();
    loadMessengerLegacyAccess.mockResolvedValue(access());
    const prisma = prismaMock({});
    await expect(
      subscribeSocketToCoreConversation(prisma as never, 'e1', null, join),
    ).resolves.toEqual({ ok: false });
    await expect(
      subscribeSocketToCoreConversation(prisma as never, 'e1', { conversationId: 1 }, join),
    ).resolves.toEqual({ ok: false });
    await expect(
      subscribeSocketToCoreConversation(prisma as never, undefined, { conversationId: 'c1' }, join),
    ).resolves.toEqual({ ok: false });
    expect(join).not.toHaveBeenCalled();
  });

  it('denies Internal ACL when the caller is not a participant', async () => {
    const join = vi.fn();
    loadMessengerLegacyAccess.mockResolvedValue(access({ viewScope: 'OWN' }));
    const prisma = prismaMock({
      conversation: { id: 'c1', zone: 'INTERNAL', type: 'INTERNAL_GROUP' },
    });
    await expect(
      subscribeSocketToCoreConversation(prisma as never, 'e1', { conversationId: 'c1' }, join),
    ).resolves.toEqual({ ok: false });
    expect(join).not.toHaveBeenCalled();
  });

  it('denies Client ACL when CLIENT_READ is NONE and the caller is not a participant', async () => {
    const join = vi.fn();
    loadMessengerLegacyAccess.mockResolvedValue(access({ viewScope: 'ALL', clientReadScope: 'NONE' }));
    const prisma = prismaMock({
      conversation: { id: 'c1', zone: 'CLIENT', type: 'EXTERNAL' },
    });
    await expect(
      subscribeSocketToCoreConversation(prisma as never, 'e1', { conversationId: 'c1' }, join),
    ).resolves.toEqual({ ok: false });
    expect(join).not.toHaveBeenCalled();
  });

  it('denies Task conversations when MESSENGER.VIEW ALL lacks Task access', async () => {
    const join = vi.fn();
    loadMessengerLegacyAccess.mockResolvedValue(
      access({ viewScope: 'ALL', editScope: 'ALL', tasksViewScope: 'OWN' }),
    );
    const prisma = prismaMock({
      conversation: { id: 'task-conv', zone: 'INTERNAL', type: 'TASK' },
      taskLink: { entityId: 'task-1' },
      taskFindFirst: null,
    });
    await expect(
      subscribeSocketToCoreConversation(
        prisma as never,
        'e1',
        { conversationId: 'task-conv' },
        join,
      ),
    ).resolves.toEqual({ ok: false });
    expect(join).not.toHaveBeenCalled();
    expect(prisma.task.findFirst).toHaveBeenCalled();
  });
});

describe('leaveSocketCoreConversation', () => {
  it('leaves only the derived conversation room', async () => {
    const leave = vi.fn();
    await expect(
      leaveSocketCoreConversation('e1', { conversationId: 'A' }, leave),
    ).resolves.toEqual({ ok: true });
    expect(leave).toHaveBeenCalledTimes(1);
    expect(leave).toHaveBeenCalledWith(messengerSocketConversationRoom('A'));
  });

  it('does not leave when the body is malformed', async () => {
    const leave = vi.fn();
    await expect(leaveSocketCoreConversation('e1', {}, leave)).resolves.toEqual({ ok: false });
    await expect(leaveSocketCoreConversation(undefined, { conversationId: 'A' }, leave)).resolves.toEqual(
      { ok: false },
    );
    expect(leave).not.toHaveBeenCalled();
  });
});
