import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { actorContextFromEmployee, actorContextFromMachine } from '@nbos/shared';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { TaskDiscussionService } from './task-discussion.service';

describe('TaskDiscussionService', () => {
  let prisma: MockPrisma;
  let service: TaskDiscussionService;

  beforeEach(() => {
    prisma = createMockPrisma();
    prisma.task.findUnique.mockResolvedValue({ id: 'task-1', trashedAt: null });
    prisma.task.findUniqueOrThrow.mockResolvedValue({ trashedAt: null });
    service = new TaskDiscussionService(prisma as never);
  });

  it('records an External Agent as the author, not an Employee', async () => {
    prisma.taskDiscussionEntry.create.mockResolvedValue({
      id: 'entry-1',
      body: 'Working on the race',
      actorType: 'EXTERNAL_AGENT',
      actorId: 'agent-1',
      actorDisplayName: 'Cursor Agent',
      channelSource: 'mcp',
      createdAt: new Date('2026-08-21T00:00:00.000Z'),
    });

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
    expect(prisma.taskDiscussionEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorType: 'EXTERNAL_AGENT',
          actorId: 'agent-1',
          actorDisplayName: 'Cursor Agent',
        }),
      }),
    );
    expect(prisma.taskDiscussionEntry.create.mock.calls[0]?.[0].data).not.toHaveProperty(
      'employeeId',
    );
  });

  it('records a human Employee through ActorContext', async () => {
    prisma.taskDiscussionEntry.create.mockResolvedValue({
      id: 'entry-2',
      body: 'Looks good',
      actorType: 'USER',
      actorId: 'emp-1',
      actorDisplayName: 'Ada Lovelace',
      channelSource: 'web',
      createdAt: new Date(),
    });

    await service.addEntry(
      'task-1',
      actorContextFromEmployee({ id: 'emp-1', firstName: 'Ada', lastName: 'Lovelace' }),
      'Looks good',
    );

    expect(prisma.taskDiscussionEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ actorType: 'USER', actorId: 'emp-1' }),
      }),
    );
  });

  it('rejects an empty body', async () => {
    await expect(service.addEntry('task-1', actorContextFromUser(), '   ')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('hides discussion on a missing or trashed task', async () => {
    prisma.task.findUnique.mockResolvedValue(null);
    await expect(service.listEntries('missing', {})).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lists only STANDARD visibility entries', async () => {
    prisma.taskDiscussionEntry.findMany.mockResolvedValue([]);
    prisma.taskDiscussionEntry.count.mockResolvedValue(0);
    await service.listEntries('task-1', { page: 1, pageSize: 20 });
    expect(prisma.taskDiscussionEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { taskId: 'task-1', visibility: 'STANDARD' },
      }),
    );
  });

  it('returns the latest page when asked for history beyond the default page size', async () => {
    prisma.taskDiscussionEntry.count.mockResolvedValue(21);
    prisma.taskDiscussionEntry.findMany.mockResolvedValue([]);
    const page = await service.listEntries('task-1', { latest: true, pageSize: 20 });
    expect(page.meta).toMatchObject({ total: 21, page: 2, pageSize: 20, totalPages: 2 });
    expect(prisma.taskDiscussionEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 20 }),
    );
  });
});

function actorContextFromUser() {
  return actorContextFromEmployee({ id: 'emp-1', firstName: 'Ada', lastName: 'Lovelace' });
}
