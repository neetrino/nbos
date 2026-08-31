import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { actorContextFromEmployee, actorContextFromMachine } from '@nbos/shared';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { TaskDiscussionService } from './task-discussion.service';
import { taskCanonicalKey } from '../messenger/core/messenger-core-canonical-key';
import { TASK_DISCUSSION_LEGACY_WRITES_DISABLED } from './task-discussion.constants';

const ensureTaskConversation = vi.fn();
const persistCoreMessage = vi.fn();

vi.mock('../messenger/core/messenger-core-task-ensure.ops', () => ({
  ensureTaskConversation: (...args: unknown[]) => ensureTaskConversation(...args),
}));

vi.mock('../messenger/core/messenger-core-message.ops', () => ({
  persistCoreMessage: (...args: unknown[]) => persistCoreMessage(...args),
}));

describe('TaskDiscussionService', () => {
  let prisma: MockPrisma;
  let core: { persistAndBroadcast: ReturnType<typeof vi.fn> };
  let service: TaskDiscussionService;

  beforeEach(() => {
    prisma = createMockPrisma();
    prisma.task.findUnique.mockResolvedValue({ id: 'task-1', trashedAt: null });
    prisma.task.findUniqueOrThrow.mockResolvedValue({ trashedAt: null });
    core = {
      persistAndBroadcast: vi.fn().mockResolvedValue({
        id: 'msg-emp',
        content: 'Looks good',
        senderName: 'Ada Lovelace',
        createdAt: new Date('2026-08-21T00:00:00.000Z'),
      }),
    };
    ensureTaskConversation.mockReset().mockResolvedValue({
      id: 'conv-task',
      type: 'TASK',
      canonicalKey: taskCanonicalKey('task-1'),
      created: true,
    });
    persistCoreMessage.mockReset().mockResolvedValue({
      id: 'msg-agent',
      content: 'Working on the race',
      senderName: 'Cursor Agent',
      createdAt: new Date('2026-08-21T00:00:00.000Z'),
    });
    service = new TaskDiscussionService(prisma as never, core as never);
  });

  it('records an External Agent on Core without forging an Employee sender', async () => {
    const entry = await service.addEntry(
      'task-1',
      actorContextFromMachine(
        { id: 'agent-1', type: 'EXTERNAL_AGENT', displayName: 'Cursor Agent' },
        { channel: { source: 'mcp' } },
      ),
      'Working on the race',
    );
    expect(entry.authorActorType).toBe('EXTERNAL_AGENT');
    expect(entry.authorActorId).toBe('agent-1');
    expect(persistCoreMessage).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        conversationId: 'conv-task',
        senderId: null,
        provenance: 'AI',
        senderNameSnapshot: 'Cursor Agent',
      }),
      [],
    );
    expect(core.persistAndBroadcast).not.toHaveBeenCalled();
    expect(prisma.taskDiscussionEntry.create).not.toHaveBeenCalled();
  });

  it('records a human Employee through persistAndBroadcast on Core', async () => {
    await service.addEntry(
      'task-1',
      actorContextFromEmployee({ id: 'emp-1', firstName: 'Ada', lastName: 'Lovelace' }),
      'Looks good',
    );
    expect(core.persistAndBroadcast).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: 'conv-task',
        senderId: 'emp-1',
        provenance: 'EMPLOYEE',
      }),
    );
    expect(prisma.taskDiscussionEntry.create).not.toHaveBeenCalled();
    expect(TASK_DISCUSSION_LEGACY_WRITES_DISABLED).toBe(true);
  });

  it('rejects an empty body', async () => {
    await expect(service.addEntry('task-1', actorContextFromUser(), '   ')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(ensureTaskConversation).not.toHaveBeenCalled();
  });

  it('hides discussion on a missing or trashed task', async () => {
    prisma.task.findUnique.mockResolvedValue(null);
    await expect(service.listEntries('missing', {})).rejects.toBeInstanceOf(NotFoundException);
    expect(ensureTaskConversation).not.toHaveBeenCalled();
  });

  it('does not create a conversation when listing an empty Task', async () => {
    prisma.messengerConversation.findUnique.mockResolvedValue(null);
    const page = await service.listEntries('task-1', { page: 1, pageSize: 20 });
    expect(page.items).toEqual([]);
    expect(ensureTaskConversation).not.toHaveBeenCalled();
    expect(prisma.messengerMessage.findMany).not.toHaveBeenCalled();
  });

  it('lists Core notes and excludes HIDDEN visibility', async () => {
    prisma.messengerConversation.findUnique.mockResolvedValue({ id: 'conv-task' });
    prisma.messengerMessage.count.mockResolvedValue(1);
    prisma.messengerMessage.findMany.mockResolvedValue([
      {
        id: 'msg-1',
        content: 'Visible',
        senderId: 'emp-1',
        senderNameSnapshot: 'Ada Lovelace',
        metadata: {
          taskDiscussion: {
            actorType: 'USER',
            actorId: 'emp-1',
            channelSource: 'web',
            correlationId: null,
            visibility: 'STANDARD',
          },
        },
        createdAt: new Date('2026-08-21T00:00:00.000Z'),
      },
    ]);
    const page = await service.listEntries('task-1', { page: 1, pageSize: 20 });
    expect(page.items[0]?.body).toBe('Visible');
    expect(prisma.messengerMessage.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          NOT: {
            metadata: {
              path: ['taskDiscussion', 'visibility'],
              equals: 'HIDDEN',
            },
          },
        }),
      }),
    );
  });
});

function actorContextFromUser() {
  return actorContextFromEmployee({ id: 'emp-1', firstName: 'Ada', lastName: 'Lovelace' });
}
