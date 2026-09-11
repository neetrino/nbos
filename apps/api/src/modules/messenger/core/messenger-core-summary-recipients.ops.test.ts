import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  absoluteRecipientUnreadCount,
  deriveRecipientConversationSummaries,
} from './messenger-core-summary-recipients.ops';

const loadMessengerLegacyAccessForEmployees = vi.fn();

vi.mock('../access/messenger-legacy-channel-access.op', async () => {
  const actual = await vi.importActual<
    typeof import('../access/messenger-legacy-channel-access.op')
  >('../access/messenger-legacy-channel-access.op');
  return {
    ...actual,
    loadMessengerLegacyAccessForEmployees: (...args: unknown[]) =>
      loadMessengerLegacyAccessForEmployees(...args),
  };
});

function access(employeeId: string, overrides: Record<string, unknown> = {}) {
  return {
    employeeId,
    departmentIds: [],
    viewScope: 'OWN',
    editScope: 'OWN',
    clientReadScope: 'NONE',
    clientSendScope: 'NONE',
    tasksViewScope: 'OWN',
    ...overrides,
  };
}

function prismaForRecipients(input: {
  participants?: Array<{ employeeId: string; role: 'OWNER' | 'MEMBER' | 'READ_ONLY' }>;
  grants?: Array<{ employeeId: string; level: string }>;
  readStates?: Array<{ employeeId: string; lastReadAt: Date }>;
  taskLink?: { entityId: string } | null;
  taskAccessible?: boolean;
}) {
  return {
    messengerConversationParticipant: {
      findMany: vi.fn().mockResolvedValue(input.participants ?? []),
    },
    resourceAccessGrant: {
      findMany: vi.fn().mockResolvedValue(input.grants ?? []),
    },
    messengerConversationReadState: {
      findMany: vi.fn().mockResolvedValue(input.readStates ?? []),
    },
    messengerConversationLink: {
      findFirst: vi.fn().mockResolvedValue(input.taskLink ?? null),
    },
    task: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'task-1',
        title: 'T',
        creatorId: 'owner',
        assigneeId: null,
        reviewerId: null,
        coAssignees: [],
        observers: [],
        trashedAt: null,
      }),
      findFirst: vi.fn().mockResolvedValue(input.taskAccessible ? { id: 'task-1' } : null),
    },
    employeeDepartment: { findMany: vi.fn().mockResolvedValue([]) },
  };
}

describe('deriveRecipientConversationSummaries', () => {
  beforeEach(() => {
    loadMessengerLegacyAccessForEmployees.mockReset();
  });
  it('returns nothing and skips queries when nobody is connected', async () => {
    const prisma = prismaForRecipients({});
    const result = await deriveRecipientConversationSummaries(prisma as never, {
      conversationId: 'c1',
      zone: 'INTERNAL',
      conversationType: 'INTERNAL_GROUP',
      senderId: 'sender',
      lastMessageAt: new Date('2026-09-05T12:00:00.000Z'),
      lastMessagePreview: 'hello',
      connectedEmployeeIds: [],
    });
    expect(result).toEqual([]);
    expect(loadMessengerLegacyAccessForEmployees).not.toHaveBeenCalled();
    expect(prisma.messengerConversationParticipant.findMany).not.toHaveBeenCalled();
  });

  it('omits inaccessible connected employees and keeps sender unread at 0', async () => {
    loadMessengerLegacyAccessForEmployees.mockResolvedValue(
      new Map([
        ['sender', access('sender')],
        ['member', access('member')],
        ['stranger', access('stranger')],
      ]),
    );
    const lastMessageAt = new Date('2026-09-05T12:00:00.000Z');
    const prisma = prismaForRecipients({
      participants: [
        { employeeId: 'sender', role: 'MEMBER' },
        { employeeId: 'member', role: 'MEMBER' },
      ],
      readStates: [{ employeeId: 'sender', lastReadAt: new Date('2026-01-01T00:00:00.000Z') }],
    });
    const result = await deriveRecipientConversationSummaries(prisma as never, {
      conversationId: 'c1',
      zone: 'INTERNAL',
      conversationType: 'INTERNAL_GROUP',
      senderId: 'sender',
      lastMessageAt,
      lastMessagePreview: 'hello',
      connectedEmployeeIds: ['sender', 'member', 'stranger', 'sender'],
    });
    const byId = new Map(result.map((row) => [row.employeeId, row.payload]));
    expect([...byId.keys()].sort()).toEqual(['member', 'sender']);
    expect(byId.get('sender')?.unreadCount).toBe(0);
    expect(byId.get('sender')?.lastReadAt).toBe('2026-01-01T00:00:00.000Z');
    expect(byId.get('member')?.unreadCount).toBe(1);
    expect(byId.get('member')?.lastReadAt).toBeNull();
    expect(byId.get('stranger')).toBeUndefined();
    expect(prisma.messengerConversationParticipant.findMany).toHaveBeenCalledTimes(1);
  });

  it('does not double unread when the same facts are derived twice', async () => {
    loadMessengerLegacyAccessForEmployees.mockResolvedValue(
      new Map([['member', access('member')]]),
    );
    const lastMessageAt = new Date('2026-09-05T12:00:00.000Z');
    const input = {
      conversationId: 'c1',
      zone: 'INTERNAL' as const,
      conversationType: 'INTERNAL_GROUP',
      senderId: 'sender',
      lastMessageAt,
      lastMessagePreview: 'hello',
      connectedEmployeeIds: ['member'],
    };
    const first = await deriveRecipientConversationSummaries(
      prismaForRecipients({
        participants: [{ employeeId: 'member', role: 'MEMBER' }],
      }) as never,
      input,
    );
    const second = await deriveRecipientConversationSummaries(
      prismaForRecipients({
        participants: [{ employeeId: 'member', role: 'MEMBER' }],
      }) as never,
      input,
    );
    expect(first[0]?.payload.unreadCount).toBe(1);
    expect(second[0]?.payload.unreadCount).toBe(1);
  });

  it('fans WhatsApp/Meta inbound summaries to inactive authorized recipients only', async () => {
    loadMessengerLegacyAccessForEmployees.mockResolvedValue(
      new Map([
        ['member', access('member', { clientReadScope: 'NONE' })],
        ['viewer', access('viewer', { clientReadScope: 'ALL' })],
        ['stranger', access('stranger', { clientReadScope: 'NONE' })],
      ]),
    );
    const lastMessageAt = new Date('2026-09-05T12:00:00.000Z');
    const result = await deriveRecipientConversationSummaries(
      prismaForRecipients({
        participants: [{ employeeId: 'member', role: 'MEMBER' }],
      }) as never,
      {
        conversationId: 'wa-1',
        zone: 'CLIENT',
        conversationType: 'EXTERNAL',
        senderId: null,
        lastMessageAt,
        lastMessagePreview: 'from whatsapp',
        connectedEmployeeIds: ['member', 'viewer', 'stranger'],
      },
    );
    const byId = new Map(result.map((row) => [row.employeeId, row.payload]));
    expect([...byId.keys()].sort()).toEqual(['member', 'viewer']);
    expect(byId.get('member')?.unreadCount).toBe(1);
    expect(byId.get('viewer')?.unreadCount).toBe(1);
    expect(byId.get('stranger')).toBeUndefined();
  });

  it('excludes Task conversations when the connected employee cannot open the Task', async () => {
    loadMessengerLegacyAccessForEmployees.mockResolvedValue(
      new Map([['outsider', access('outsider', { viewScope: 'ALL', editScope: 'ALL' })]]),
    );
    const prisma = prismaForRecipients({
      taskLink: { entityId: 'task-1' },
      taskAccessible: false,
    });
    const result = await deriveRecipientConversationSummaries(prisma as never, {
      conversationId: 'task-conv',
      zone: 'INTERNAL',
      conversationType: 'TASK',
      senderId: 'owner',
      lastMessageAt: new Date('2026-09-05T12:00:00.000Z'),
      lastMessagePreview: 'note',
      connectedEmployeeIds: ['outsider'],
    });
    expect(result).toEqual([]);
    expect(prisma.task.findFirst).toHaveBeenCalled();
  });
});

describe('absoluteRecipientUnreadCount', () => {
  it('does not unread the sender for their own send', () => {
    expect(
      absoluteRecipientUnreadCount({
        employeeId: 'sender',
        senderId: 'sender',
        lastMessageAt: new Date('2026-09-05T12:00:00.000Z'),
        lastReadAt: new Date('2020-01-01T00:00:00.000Z'),
      }),
    ).toBe(0);
  });

  it('keeps inbound/external null sender unread when the cursor is behind', () => {
    expect(
      absoluteRecipientUnreadCount({
        employeeId: 'member',
        senderId: null,
        lastMessageAt: new Date('2026-09-05T12:00:00.000Z'),
        lastReadAt: new Date('2020-01-01T00:00:00.000Z'),
      }),
    ).toBe(1);
  });
});
