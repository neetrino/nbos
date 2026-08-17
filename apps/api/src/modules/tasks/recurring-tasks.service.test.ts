import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { RecurringTasksService } from './recurring-tasks.service';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';

describe('RecurringTasksService', () => {
  let service: RecurringTasksService;
  let prisma: MockPrisma;
  let tasksService: {
    create: ReturnType<typeof vi.fn>;
    createChecklist: ReturnType<typeof vi.fn>;
    addChecklistItem: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-06T10:00:00.000Z'));
    prisma = createMockPrisma();
    tasksService = {
      create: vi.fn().mockResolvedValue({ id: 'task-1', code: 'T-2026-0001' }),
      createChecklist: vi.fn().mockResolvedValue({ id: 'cl-1' }),
      addChecklistItem: vi.fn(),
    };
    service = new RecurringTasksService(prisma as never, tasksService as never);
  });

  it('validates frequency on create', async () => {
    await expect(
      service.create({
        title: 'Bad template',
        creatorId: 'u1',
        frequency: 'HOURLY',
        startDate: '2026-05-01T10:00:00.000Z',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('validates weekly weekday codes', async () => {
    await expect(
      service.create({
        title: 'Weekly',
        creatorId: 'u1',
        frequency: 'WEEKLY',
        interval: 1,
        daysOfWeek: ['MON'],
        startDate: '2026-05-01T10:00:00.000Z',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('validates monthly dayOfMonth range', async () => {
    await expect(
      service.create({
        title: 'Monthly',
        creatorId: 'u1',
        frequency: 'MONTHLY',
        dayOfMonth: 40,
        startDate: '2026-05-01T10:00:00.000Z',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('computes nextCreateAt for weekly days-of-week schedule', async () => {
    prisma.recurringTaskTemplate.create.mockImplementation(({ data }) =>
      Promise.resolve({ id: 'tpl-1', ...data }),
    );

    const created = await service.create({
      title: 'Weekly',
      creatorId: 'u1',
      frequency: 'WEEKLY',
      interval: 1,
      daysOfWeek: ['MO', 'WE'],
      startDate: '2026-05-04T10:00:00.000Z',
    });

    expect(created.nextCreateAt?.toISOString()).toBe('2026-05-11T10:00:00.000Z');
  });

  it('recomputes nextCreateAt on update when cadence fields change', async () => {
    prisma.recurringTaskTemplate.findUnique.mockResolvedValue({
      id: 'tpl-1',
      frequency: 'WEEKLY',
      interval: 1,
      startDate: new Date('2026-05-01T10:00:00.000Z'),
      endDate: null,
      dueDateOffset: 2,
      daysOfWeek: ['FR'],
      dayOfMonth: null,
      creator: { id: 'u1', firstName: 'A', lastName: 'B' },
      assignee: null,
    });
    prisma.recurringTaskTemplate.update.mockImplementation(({ data }) =>
      Promise.resolve({ id: 'tpl-1', ...data }),
    );

    const updated = await service.update('tpl-1', {
      frequency: 'MONTHLY',
      interval: 1,
      dayOfMonth: 10,
    });

    expect(updated.nextCreateAt?.toISOString()).toBe('2026-05-10T10:00:00.000Z');
  });

  it('spawns a due template and advances nextCreateAt', async () => {
    prisma.recurringTaskTemplate.findMany.mockResolvedValue([
      {
        id: 'tpl-1',
        title: 'Weekly',
        description: null,
        creatorId: 'u1',
        assigneeId: null,
        priority: 'NORMAL',
        frequency: 'WEEKLY',
        interval: 1,
        daysOfWeek: ['WE'],
        dayOfMonth: null,
        startDate: new Date('2026-05-06T10:00:00.000Z'),
        endDate: null,
        dueDateOffset: 1,
        checklistData: { items: ['Check SSL'] },
        linksData: null,
        nextCreateAt: new Date('2026-05-06T10:00:00.000Z'),
      },
    ]);

    const result = await service.processDueTemplates();

    expect(result.created).toBe(1);
    expect(tasksService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Weekly',
        isRecurring: true,
        templateTaskId: 'tpl-1',
      }),
    );
    expect(tasksService.createChecklist).toHaveBeenCalledWith('task-1', 'Checklist');
    expect(prisma.recurringTaskTemplate.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'tpl-1' },
        data: expect.objectContaining({ lastCreatedAt: new Date('2026-05-06T10:00:00.000Z') }),
      }),
    );
  });
});
