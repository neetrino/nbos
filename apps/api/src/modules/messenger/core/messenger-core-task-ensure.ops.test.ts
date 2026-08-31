import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildTasksParticipationWhere } from '../../tasks/task-involves-employee-where.op';
import { ensureTaskConversation } from './messenger-core-task-ensure.ops';
import { taskCanonicalKey } from './messenger-core-canonical-key';

const TASK_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddd0001';
const EMPLOYEE_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const OUTSIDER_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

function taskRow() {
  return {
    id: TASK_ID,
    title: 'Fix payment callback',
    creatorId: EMPLOYEE_ID,
    assigneeId: EMPLOYEE_ID,
    reviewerId: null,
    coAssignees: [],
    observers: [],
    trashedAt: null,
  };
}

function conversationRow() {
  return {
    id: 'conv-task',
    zone: 'INTERNAL',
    type: 'TASK',
    title: 'Fix payment callback',
    status: 'ACTIVE',
    canonicalKey: taskCanonicalKey(TASK_ID),
    createdAt: new Date(),
    lastMessageAt: null,
  };
}

function createPrisma() {
  return {
    task: { findUnique: vi.fn(), findFirst: vi.fn() },
    employeeDepartment: { findMany: vi.fn().mockResolvedValue([]) },
    messengerConversation: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    messengerConversationLink: { createMany: vi.fn() },
    messengerConversationParticipant: {
      findMany: vi.fn().mockResolvedValue([]),
      createMany: vi.fn(),
    },
    messengerLegacyIdentity: { createMany: vi.fn() },
    messengerMessage: { create: vi.fn() },
    messengerChannelMessage: { create: vi.fn() },
    messengerDirectMessage: { create: vi.fn() },
  };
}

describe('ensureTaskConversation', () => {
  let prisma: ReturnType<typeof createPrisma>;

  beforeEach(() => {
    prisma = createPrisma();
    prisma.task.findUnique.mockResolvedValue(taskRow());
    prisma.task.findFirst.mockResolvedValue({ id: TASK_ID });
  });

  it('creates one TASK conversation with task:{taskId} and TASK PRIMARY', async () => {
    prisma.messengerConversation.findUnique.mockResolvedValue(null);
    prisma.messengerConversation.create.mockResolvedValue(conversationRow());
    const created = await ensureTaskConversation(
      prisma as never,
      TASK_ID,
      {
        employeeId: EMPLOYEE_ID,
        departmentIds: [],
        viewScope: 'OWN',
      },
      EMPLOYEE_ID,
    );
    expect(created.type).toBe('TASK');
    expect(created.canonicalKey).toBe(taskCanonicalKey(TASK_ID));
    const data = prisma.messengerConversation.create.mock.calls[0]?.[0]?.data as {
      type: string;
      zone: string;
      canonicalKey: string;
      links: { create: Array<{ entityType: string; relationType: string }> };
    };
    expect(data.type).toBe('TASK');
    expect(data.zone).toBe('INTERNAL');
    expect(data.canonicalKey).toBe(taskCanonicalKey(TASK_ID));
    expect(data.links.create).toEqual([
      { entityType: 'TASK', entityId: TASK_ID, relationType: 'PRIMARY' },
    ]);
    expect(prisma.messengerChannelMessage.create).not.toHaveBeenCalled();
    expect(prisma.messengerDirectMessage.create).not.toHaveBeenCalled();
  });

  it('does not duplicate messages on duplicate ensure', async () => {
    prisma.messengerConversation.findUnique.mockResolvedValue(conversationRow());
    await ensureTaskConversation(
      prisma as never,
      TASK_ID,
      {
        employeeId: EMPLOYEE_ID,
        departmentIds: [],
        viewScope: 'OWN',
      },
      EMPLOYEE_ID,
    );
    await ensureTaskConversation(
      prisma as never,
      TASK_ID,
      {
        employeeId: EMPLOYEE_ID,
        departmentIds: [],
        viewScope: 'OWN',
      },
      EMPLOYEE_ID,
    );
    expect(prisma.messengerConversation.create).not.toHaveBeenCalled();
    expect(prisma.messengerMessage.create).not.toHaveBeenCalled();
  });

  it('404s OWN non-member before create and does not mint a participant', async () => {
    prisma.task.findFirst.mockImplementation(async (args: { where: unknown }) => {
      expect(JSON.stringify(args.where)).toContain(OUTSIDER_ID);
      expect(args.where).toEqual(
        expect.objectContaining({
          AND: [{ id: TASK_ID }, buildTasksParticipationWhere([OUTSIDER_ID])],
        }),
      );
      return null;
    });
    await expect(
      ensureTaskConversation(
        prisma as never,
        TASK_ID,
        { employeeId: OUTSIDER_ID, departmentIds: [], viewScope: 'OWN' },
        OUTSIDER_ID,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.messengerConversation.create).not.toHaveBeenCalled();
    expect(prisma.messengerConversationParticipant.createMany).not.toHaveBeenCalled();
  });

  it('does not write Task.chatId', async () => {
    prisma.messengerConversation.findUnique.mockResolvedValue(null);
    prisma.messengerConversation.create.mockResolvedValue(conversationRow());
    await ensureTaskConversation(
      prisma as never,
      TASK_ID,
      {
        employeeId: EMPLOYEE_ID,
        departmentIds: [],
        viewScope: 'OWN',
      },
      EMPLOYEE_ID,
    );
    expect(JSON.stringify(prisma.messengerConversation.create.mock.calls)).not.toContain('chatId');
    expect(prisma.task.findUnique).not.toHaveBeenCalledWith(
      expect.objectContaining({ select: expect.objectContaining({ chatId: true }) }),
    );
  });
});
