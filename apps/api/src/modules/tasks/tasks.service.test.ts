import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TasksService } from './tasks.service';
import { TASK_INCLUDE } from './task-response-includes';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('TasksService', () => {
  let service: TasksService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    const notifications = { create: vi.fn().mockResolvedValue({ id: 'n1' }) };
    service = new TasksService(prisma as never, notifications as never);
  });

  describe('findAll', () => {
    it('returns paginated result', async () => {
      const result = await service.findAll({});
      expect(result.meta.page).toBe(1);
    });

    it('applies filters', async () => {
      await service.findAll({
        status: 'OPEN',
        priority: 'HIGH',
        assigneeId: 'a1',
        workspaceId: 'ws-1',
        planningStatus: 'BACKLOG',
        search: 'test',
      });
      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            AND: expect.arrayContaining([
              { workspaceId: 'ws-1' },
              { planningStatus: 'BACKLOG' },
              expect.objectContaining({
                OR: expect.arrayContaining([
                  { title: { contains: 'test', mode: 'insensitive' } },
                  { code: { contains: 'test', mode: 'insensitive' } },
                ]),
              }),
            ]),
          },
        }),
      );
    });

    it('applies involvesEmployeeId filter', async () => {
      await service.findAll({ involvesEmployeeId: 'emp-1' });
      const listCall = prisma.task.findMany.mock.calls[0]?.[0] as {
        where?: { OR?: unknown[] };
      };
      expect(listCall?.where?.OR).toEqual(
        expect.arrayContaining([
          { assigneeId: { in: ['emp-1'] } },
          { creatorId: { in: ['emp-1'] } },
          { coAssignees: { hasSome: ['emp-1'] } },
          { observers: { hasSome: ['emp-1'] } },
        ]),
      );
    });

    it('rejects orderId without projectId', async () => {
      await expect(service.findAll({ orderId: 'ord-1' })).rejects.toThrow(BadRequestException);
    });

    it('gates projectId list to project participation when TASKS_VIEW is scoped', async () => {
      prisma.project.findFirst.mockResolvedValue({ id: 'p1' });
      await service.findAll({
        projectId: 'p1',
        access: { employeeId: 'emp-1', departmentIds: [], viewScope: 'OWN' },
      });
      expect(prisma.project.findFirst).toHaveBeenCalled();
    });

    it('gates workspaceId list to work space participation', async () => {
      prisma.workSpace.findFirst.mockResolvedValue({ id: 'ws-1' });
      await service.findAll({
        workspaceId: 'ws-1',
        access: { employeeId: 'emp-1', departmentIds: [], viewScope: 'OWN' },
      });
      expect(prisma.workSpace.findFirst).toHaveBeenCalled();
    });

    it('applies participation filter when list has no projectId', async () => {
      await service.findAll({
        access: { employeeId: 'emp-1', departmentIds: [], viewScope: 'OWN' },
      });
      const listCall = prisma.task.findMany.mock.calls[0]?.[0] as {
        where?: { OR?: unknown[] };
      };
      expect(listCall?.where?.OR).toEqual(
        expect.arrayContaining([{ assigneeId: { in: ['emp-1'] } }]),
      );
    });

    it('validates order belongs to project when both ids are set', async () => {
      prisma.order.findUnique.mockResolvedValue({ projectId: 'p1' });
      prisma.project.findFirst.mockResolvedValue({ id: 'p1' });
      await service.findAll({
        projectId: 'p1',
        orderId: 'ord-1',
        pageSize: 50,
        access: { employeeId: 'emp-1', departmentIds: [], viewScope: 'ALL' },
      });
      expect(prisma.order.findUnique).toHaveBeenCalledWith({
        where: { id: 'ord-1' },
        select: { projectId: true },
      });
      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({ product: expect.anything() }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('throws NotFoundException', async () => {
      await expect(service.findById('x')).rejects.toThrow(NotFoundException);
    });

    it('checks participation before load when access is scoped', async () => {
      prisma.task.findFirst.mockResolvedValue({ id: 't1' });
      prisma.task.findUnique.mockResolvedValue({ id: 't1', title: 'Task' });
      await service.findById('t1', {
        employeeId: 'emp-1',
        departmentIds: [],
        viewScope: 'OWN',
      });
      expect(prisma.task.findFirst).toHaveBeenCalled();
      expect(prisma.task.findUnique).toHaveBeenCalled();
    });
  });

  describe('findByEntity', () => {
    it('returns tasks linked to a product entity', async () => {
      prisma.task.findMany.mockResolvedValue([{ id: 't1', title: 'Build landing page' }]);

      const result = await service.findByEntity('PRODUCT', 'prod-1');

      expect(result).toHaveLength(1);
      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { links: { some: { entityType: 'PRODUCT', entityId: 'prod-1' } } },
        }),
      );
    });

    it('returns tasks linked to an extension entity', async () => {
      prisma.task.findMany.mockResolvedValue([{ id: 't2', title: 'Fix extension QA issue' }]);

      const result = await service.findByEntity('EXTENSION', 'ext-1');

      expect(result).toHaveLength(1);
      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { links: { some: { entityType: 'EXTENSION', entityId: 'ext-1' } } },
        }),
      );
    });
  });

  describe('create', () => {
    it('generates code T-YYYY-NNNN', async () => {
      prisma.task.findMany.mockResolvedValue([]);
      prisma.task.create.mockResolvedValue({ id: '1', code: 'T-2026-0001' });
      const result = await service.create({ title: 'Test', creatorId: 'c1' });
      expect(result.code).toMatch(/^T-\d{4}-\d{4}$/);
      expect(prisma.task.create).toHaveBeenCalledWith(
        expect.objectContaining({ include: TASK_INCLUDE }),
      );
    });

    it('creates task inside a Work Space planning layer', async () => {
      prisma.task.findMany.mockResolvedValue([]);
      await service.create({
        title: 'Backlog task',
        creatorId: 'c1',
        workspaceId: 'ws-1',
        planningStatus: 'BACKLOG',
      });

      expect(prisma.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            workspaceId: 'ws-1',
            planningStatus: 'BACKLOG',
          }),
          include: TASK_INCLUDE,
        }),
      );
    });

    it('normalizes completion rules on create', async () => {
      prisma.task.findMany.mockResolvedValue([]);
      await service.create({
        title: 'Controlled task',
        creatorId: 'c1',
        completionRules: ['requires_checklist_complete'],
      });

      expect(prisma.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            completionRules: [{ type: 'requires_checklist_complete', enabled: true }],
          }),
        }),
      );
    });
  });

  describe('update', () => {
    it('updates task', async () => {
      prisma.task.findUnique.mockResolvedValue({ id: '1' });
      prisma.task.update.mockResolvedValue({ id: '1', title: 'Updated' });
      const result = await service.update('1', {
        title: 'Updated',
        priority: 'HIGH',
        workspaceId: 'ws-1',
        planningStatus: 'ACTIVE_SPRINT',
        workspaceSortOrder: 10,
        dueDate: '2026-12-31',
      });
      expect(result.title).toBe('Updated');
      expect(prisma.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            workspaceId: 'ws-1',
            planningStatus: 'ACTIVE_SPRINT',
            workspaceSortOrder: 10,
          }),
        }),
      );
    });
  });

  describe('start', () => {
    it('starts a task', async () => {
      prisma.task.findUnique.mockResolvedValue({ id: '1', status: 'OPEN' });
      prisma.task.update.mockResolvedValue({ id: '1', status: 'IN_PROGRESS' });
      const result = await service.start('1');
      expect(result.status).toBe('IN_PROGRESS');
    });
  });

  describe('complete', () => {
    it('completes a task', async () => {
      prisma.task.findUnique.mockResolvedValue({
        id: '1',
        status: 'IN_PROGRESS',
        completionRules: null,
        checklists: [],
        subtasks: [],
      });
      prisma.task.update.mockResolvedValue({ id: '1', status: 'COMPLETED' });
      const result = await service.complete('1');
      expect(result.status).toBe('COMPLETED');
    });

    it('blocks completion when required checklist has open items', async () => {
      prisma.task.findUnique.mockResolvedValue({
        id: '1',
        status: 'IN_PROGRESS',
        completionRules: ['requires_checklist_complete'],
        checklists: [{ items: [{ checked: true }, { checked: false }] }],
        subtasks: [],
      });

      await expect(service.complete('1')).rejects.toMatchObject({
        response: expect.objectContaining({
          message: 'Task completion blocked.',
          blockers: [
            expect.objectContaining({
              ruleType: 'requires_checklist_complete',
              code: 'CHECKLIST_INCOMPLETE',
            }),
          ],
        }),
      });
      expect(prisma.task.update).not.toHaveBeenCalled();
    });

    it('blocks completion when required subtasks are open', async () => {
      prisma.task.findUnique.mockResolvedValue({
        id: '1',
        status: 'IN_PROGRESS',
        completionRules: ['requires_subtasks_complete'],
        checklists: [],
        subtasks: [
          { code: 'T-2026-0002', title: 'Open child', status: 'IN_PROGRESS' },
          { code: 'T-2026-0003', title: 'Done child', status: 'COMPLETED' },
        ],
      });

      await expect(service.complete('1')).rejects.toMatchObject({
        response: expect.objectContaining({
          blockers: [expect.objectContaining({ code: 'SUBTASKS_OPEN' })],
        }),
      });
      expect(prisma.task.update).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('deletes empty OPEN draft', async () => {
      prisma.task.findUnique.mockResolvedValue({
        id: '1',
        status: 'OPEN',
        links: [],
        checklists: [],
        subtasks: [],
        completedAt: null,
        reviewRequestedAt: null,
        _count: { subtasks: 0, checklists: 0 },
      });
      await service.delete('1');
      expect(prisma.task.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('blocks delete when task has links', async () => {
      prisma.task.findUnique.mockResolvedValue({
        id: '1',
        status: 'OPEN',
        links: [{ id: 'l1', entityType: 'PROJECT', entityId: 'p1' }],
        checklists: [],
        subtasks: [],
        completedAt: null,
        reviewRequestedAt: null,
        _count: { subtasks: 0, checklists: 0 },
      });
      await expect(service.delete('1')).rejects.toMatchObject({
        response: expect.objectContaining({
          message: expect.stringContaining('links'),
        }),
      });
      expect(prisma.task.delete).not.toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('returns stats structure', async () => {
      const stats = await service.getStats();
      expect(stats).toHaveProperty('byStatus');
      expect(stats).toHaveProperty('byPriority');
    });

    it('scopes stats when involvesEmployeeId is set', async () => {
      await service.getStats('emp-1');
      const expectedWhere = expect.objectContaining({
        OR: expect.arrayContaining([
          { assigneeId: { in: ['emp-1'] } },
          { creatorId: { in: ['emp-1'] } },
          { coAssignees: { hasSome: ['emp-1'] } },
          { observers: { hasSome: ['emp-1'] } },
        ]),
      });
      expect(prisma.task.groupBy).toHaveBeenCalledTimes(2);
      expect(prisma.task.groupBy.mock.calls[0]?.[0]).toEqual(
        expect.objectContaining({ where: expectedWhere }),
      );
      expect(prisma.task.groupBy.mock.calls[1]?.[0]).toEqual(
        expect.objectContaining({ where: expectedWhere }),
      );
    });
  });
});
