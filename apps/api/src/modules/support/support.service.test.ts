import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SupportService } from './support.service';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { AuditService } from '../audit/audit.service';

describe('SupportService', () => {
  let service: SupportService;
  let prisma: MockPrisma;
  let auditService: Pick<AuditService, 'log'>;
  let notificationService: { create: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    prisma = createMockPrisma();
    auditService = { log: vi.fn().mockResolvedValue(undefined) } as Pick<AuditService, 'log'>;
    notificationService = { create: vi.fn().mockResolvedValue({ id: 'n1' }) };
    service = new SupportService(
      prisma as never,
      auditService as never,
      notificationService as never,
    );
  });

  describe('findAll', () => {
    it('returns paginated result', async () => {
      const result = await service.findAll({});
      expect(result.meta.page).toBe(1);
    });

    it('applies all filters', async () => {
      await service.findAll({
        projectId: 'p1',
        status: 'NEW',
        priority: 'P1',
        category: 'INCIDENT',
        coverageDecision: 'COVERED_BY_MAINTENANCE',
        assignedTo: 'a1',
        search: 'bug',
      });
      expect(prisma.supportTicket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ coverageDecision: 'COVERED_BY_MAINTENANCE' }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('throws NotFoundException', async () => {
      await expect(service.findById('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('generates code and calculates SLA', async () => {
      prisma.supportTicket.findFirst.mockResolvedValue(null);
      prisma.supportTicket.create.mockResolvedValue({
        id: '1',
        code: 'TKT-2026-0001',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        waitingState: 'NONE',
        slaPausedTotalSeconds: 0,
        slaPauseStartedAt: null,
        slaResponseDeadline: new Date('2099-01-01T00:00:00Z'),
        slaResolveDeadline: new Date('2099-01-02T00:00:00Z'),
        status: 'NEW',
      });
      const result = await service.create({
        title: 'Bug',
        projectId: 'p1',
        category: 'INCIDENT',
        priority: 'P1',
      });
      expect(result.code).toMatch(/^TKT-\d{4}-\d{4}$/);
      expect(result.slaState.state).toBe('ON_TRACK');
    });

    it('uses P3 as default priority', async () => {
      prisma.supportTicket.findFirst.mockResolvedValue(null);
      prisma.supportTicket.create.mockResolvedValue({ id: '1', code: 'TKT-2026-0001' });
      await service.create({ title: 'Request', projectId: 'p1', category: 'SERVICE_REQUEST' });
      expect(prisma.supportTicket.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ priority: 'P3' }) }),
      );
    });

    it('stores product context when provided', async () => {
      prisma.supportTicket.findFirst.mockResolvedValue(null);
      await service.create({
        title: 'Product bug',
        projectId: 'p1',
        productId: 'prod-1',
        category: 'INCIDENT',
        coverageDecision: 'COVERED_BY_MAINTENANCE',
      });

      expect(prisma.supportTicket.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            productId: 'prod-1',
            coverageDecision: 'COVERED_BY_MAINTENANCE',
          }),
        }),
      );
    });
  });

  describe('update', () => {
    it('recalculates SLA when priority changes', async () => {
      prisma.supportTicket.findUnique.mockResolvedValue({
        id: '1',
        waitingState: 'WAITING_FOR_CLIENT',
        slaPausedTotalSeconds: 10,
        slaPauseStartedAt: new Date('2026-01-02T00:00:00Z'),
      });
      prisma.supportTicket.update.mockResolvedValue({ id: '1', priority: 'P1' });
      await service.update('1', { priority: 'P1' });
      expect(prisma.supportTicket.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            priority: 'P1',
            slaResponseDeadline: expect.any(Date),
            slaResolveDeadline: expect.any(Date),
            slaPausedTotalSeconds: 0,
            slaPauseStartedAt: expect.any(Date),
          }),
        }),
      );
    });
  });

  describe('updateStatus', () => {
    it('updates status', async () => {
      prisma.supportTicket.findUnique.mockResolvedValue({
        id: '1',
        projectId: 'p1',
        status: 'NEW',
        waitingState: 'WAITING_FOR_CLIENT',
        slaPausedTotalSeconds: 0,
        slaPauseStartedAt: new Date('2026-01-01T00:00:00Z'),
        project: { id: 'p1', code: 'P1', name: 'Proj' },
        product: null,
        extensionDeal: null,
        contact: null,
        assignee: null,
      });
      prisma.supportTicket.update.mockResolvedValue({
        id: '1',
        status: 'RESOLVED',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        waitingState: 'NONE',
        waitingReason: null,
        slaPausedTotalSeconds: 3600,
        slaPauseStartedAt: null,
        slaResponseDeadline: new Date('2099-01-01T00:00:00Z'),
        slaResolveDeadline: new Date('2099-01-02T00:00:00Z'),
        project: { id: 'p1', code: 'P1', name: 'Proj' },
        product: null,
        extensionDeal: null,
        contact: null,
        assignee: null,
      });
      const result = await service.updateStatus('1', 'RESOLVED', 'user-1');
      expect(result.status).toBe('RESOLVED');
      expect(result.slaState.state).toBe('CLOSED');
    });

    it('rejects REOPENED as persistent status', async () => {
      await expect(service.updateStatus('1', 'REOPENED', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('reopen', () => {
    it('reopens closed ticket to IN_PROGRESS', async () => {
      prisma.supportTicket.findUnique.mockResolvedValue({
        id: '1',
        projectId: 'p1',
        status: 'CLOSED',
        waitingState: 'NONE',
        slaPausedTotalSeconds: 0,
        slaPauseStartedAt: null,
        project: { id: 'p1', code: 'P1', name: 'Proj' },
        product: null,
        extensionDeal: null,
        contact: null,
        assignee: null,
      });
      prisma.supportTicket.update.mockResolvedValue({
        id: '1',
        status: 'IN_PROGRESS',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        waitingState: 'NONE',
        slaPausedTotalSeconds: 0,
        slaPauseStartedAt: null,
        slaResponseDeadline: new Date('2099-01-01T00:00:00Z'),
        slaResolveDeadline: new Date('2099-01-02T00:00:00Z'),
        project: { id: 'p1', code: 'P1', name: 'Proj' },
        product: null,
        extensionDeal: null,
        contact: null,
        assignee: null,
      });

      const result = await service.reopen('1', 'user-1', 'Customer returned');

      expect(result.status).toBe('IN_PROGRESS');
      expect(prisma.supportTicket.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: '1' },
          data: expect.objectContaining({
            status: 'IN_PROGRESS',
            waitingState: 'NONE',
            waitingReason: null,
          }),
        }),
      );
    });
  });

  describe('SLA projection', () => {
    it('marks ticket as breached when resolve deadline passed', async () => {
      prisma.supportTicket.findMany.mockResolvedValue([
        {
          id: 'ticket-1',
          status: 'IN_PROGRESS',
          createdAt: new Date('2020-01-01T00:00:00Z'),
          waitingState: 'NONE',
          slaPausedTotalSeconds: 0,
          slaPauseStartedAt: null,
          slaResponseDeadline: new Date('2020-01-01T00:00:00Z'),
          slaResolveDeadline: new Date('2020-01-02T00:00:00Z'),
          project: { id: 'p1', code: 'P1', name: 'Proj' },
          product: null,
          extensionDeal: null,
          contact: null,
          assignee: null,
        },
      ]);

      const result = await service.findAll({});

      expect(result.items[0].slaState.state).toBe('BREACHED');
    });

    it('pauses SLA state while waiting overlay is active', async () => {
      prisma.supportTicket.findMany.mockResolvedValue([
        {
          id: 'ticket-1',
          status: 'IN_PROGRESS',
          createdAt: new Date('2020-01-01T00:00:00Z'),
          waitingState: 'WAITING_FOR_CLIENT',
          slaPausedTotalSeconds: 0,
          slaPauseStartedAt: new Date('2026-05-01T00:00:00Z'),
          slaResponseDeadline: new Date('2020-01-01T00:00:00Z'),
          slaResolveDeadline: new Date('2020-01-02T00:00:00Z'),
          project: { id: 'p1', code: 'P1', name: 'Proj' },
          product: null,
          extensionDeal: null,
          contact: null,
          assignee: null,
        },
      ]);

      const result = await service.findAll({});

      expect(result.items[0].slaState.state).toBe('PAUSED');
    });
  });

  describe('createExecutionTask', () => {
    it('creates linked task from support ticket context', async () => {
      prisma.supportTicket.findUnique.mockResolvedValue({
        id: 'ticket-1',
        code: 'TKT-2026-0001',
        title: 'Broken form',
        description: 'Form does not submit',
        projectId: 'project-1',
        productId: 'product-1',
        priority: 'P1',
        status: 'IN_PROGRESS',
        assignedTo: 'employee-2',
        slaResolveDeadline: new Date('2026-05-01T00:00:00Z'),
      });
      prisma.workSpace.findUnique.mockResolvedValue({ id: 'ws-1' });
      prisma.task.findFirst.mockResolvedValue(null);
      prisma.task.create.mockResolvedValue({ id: 'task-1', code: 'T-2026-0001' });

      await service.createExecutionTask('ticket-1', { creatorId: 'employee-1' });

      expect(prisma.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: '[TKT-2026-0001] Broken form',
            creatorId: 'employee-1',
            assigneeId: 'employee-2',
            priority: 'CRITICAL',
            workspaceId: 'ws-1',
            planningStatus: 'BACKLOG',
            links: {
              createMany: {
                data: expect.arrayContaining([
                  { entityType: 'SUPPORT_TICKET', entityId: 'ticket-1' },
                  { entityType: 'PROJECT', entityId: 'project-1' },
                  { entityType: 'PRODUCT', entityId: 'product-1' },
                ]),
              },
            },
          }),
        }),
      );
    });

    it('blocks execution task creation for closed ticket', async () => {
      prisma.supportTicket.findUnique.mockResolvedValue({
        id: 'ticket-1',
        code: 'TKT-2026-0001',
        title: 'Closed ticket',
        projectId: 'project-1',
        productId: null,
        priority: 'P3',
        status: 'CLOSED',
      });

      await expect(
        service.createExecutionTask('ticket-1', { creatorId: 'employee-1' }),
      ).rejects.toThrow('Resolved or closed support tickets cannot create tasks.');
      expect(prisma.task.create).not.toHaveBeenCalled();
    });
  });

  describe('createExtensionDeal', () => {
    it('creates linked Extension Deal for change request ticket', async () => {
      prisma.supportTicket.findUnique.mockResolvedValue({
        id: 'ticket-1',
        code: 'TKT-2026-0001',
        title: 'Add reports page',
        description: 'Client asks for a new reports page',
        projectId: 'project-1',
        productId: 'product-1',
        contactId: 'contact-1',
        category: 'CHANGE_REQUEST',
        priority: 'P2',
        status: 'TRIAGED',
        extensionDealId: null,
      });
      prisma.deal.findFirst.mockResolvedValue(null);
      prisma.deal.create.mockResolvedValue({ id: 'deal-1', code: 'D-2026-0001' });

      const result = await service.createExtensionDeal('ticket-1', { sellerId: 'seller-1' });

      expect(result.id).toBe('deal-1');
      expect(prisma.deal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: '[TKT-2026-0001] Add reports page',
            contactId: 'contact-1',
            projectId: 'project-1',
            type: 'EXTENSION',
            paymentType: 'CLASSIC',
            sellerId: 'seller-1',
            source: 'CLIENT',
            sourceDetail: 'Support ticket TKT-2026-0001',
            existingProductId: 'product-1',
          }),
        }),
      );
      expect(prisma.supportTicket.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ticket-1' },
          data: expect.objectContaining({ extensionDealId: 'deal-1' }),
        }),
      );
    });

    it('returns existing linked Extension Deal without duplication', async () => {
      prisma.supportTicket.findUnique.mockResolvedValue({
        id: 'ticket-1',
        code: 'TKT-2026-0001',
        title: 'Existing deal',
        projectId: 'project-1',
        productId: 'product-1',
        contactId: 'contact-1',
        category: 'CHANGE_REQUEST',
        priority: 'P2',
        status: 'TRIAGED',
        extensionDealId: 'deal-1',
      });
      prisma.deal.findUnique.mockResolvedValue({ id: 'deal-1', code: 'D-2026-0001' });

      const result = await service.createExtensionDeal('ticket-1', { sellerId: 'seller-1' });

      expect(result.id).toBe('deal-1');
      expect(prisma.deal.create).not.toHaveBeenCalled();
    });

    it('blocks non-change request tickets from creating Extension Deals', async () => {
      prisma.supportTicket.findUnique.mockResolvedValue({
        id: 'ticket-1',
        code: 'TKT-2026-0001',
        title: 'Bug',
        projectId: 'project-1',
        productId: 'product-1',
        contactId: 'contact-1',
        category: 'INCIDENT',
        priority: 'P2',
        status: 'TRIAGED',
      });

      await expect(
        service.createExtensionDeal('ticket-1', { sellerId: 'seller-1' }),
      ).rejects.toThrow('Only CHANGE_REQUEST tickets can create Extension Deals.');
      expect(prisma.deal.create).not.toHaveBeenCalled();
    });
  });

  describe('updateWaitingState', () => {
    it('updates waiting overlay and SLA pause fields', async () => {
      prisma.supportTicket.findUnique.mockResolvedValue({
        id: '1',
        projectId: 'p1',
        status: 'IN_PROGRESS',
        waitingState: 'NONE',
        slaPausedTotalSeconds: 0,
        slaPauseStartedAt: null,
        project: { id: 'p1', code: 'P1', name: 'Proj' },
        product: null,
        extensionDeal: null,
        contact: null,
        assignee: null,
      });
      prisma.supportTicket.update.mockResolvedValue({
        id: '1',
        status: 'IN_PROGRESS',
        waitingState: 'WAITING_FOR_CLIENT',
        waitingReason: null,
        slaPausedTotalSeconds: 0,
        slaPauseStartedAt: new Date('2026-05-06T00:00:00Z'),
        createdAt: new Date('2026-01-01T00:00:00Z'),
        slaResponseDeadline: new Date('2099-01-01T00:00:00Z'),
        slaResolveDeadline: new Date('2099-01-02T00:00:00Z'),
        project: { id: 'p1', code: 'P1', name: 'Proj' },
        product: null,
        extensionDeal: null,
        contact: null,
        assignee: null,
      });

      const result = await service.updateWaitingState(
        '1',
        { waitingState: 'WAITING_FOR_CLIENT' },
        'user-1',
      );

      expect(result.waitingState).toBe('WAITING_FOR_CLIENT');
      expect(result.slaState.state).toBe('PAUSED');
      expect(prisma.supportTicket.update).toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('returns stats', async () => {
      const stats = await service.getStats();
      expect(stats).toHaveProperty('byStatus');
      expect(stats).toHaveProperty('byPriority');
      expect(stats).toHaveProperty('byCategory');
      expect(stats).toHaveProperty('byCoverage');
    });
  });
});
