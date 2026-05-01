import { describe, it, expect, beforeEach } from 'vitest';
import { SupportService } from './support.service';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { NotFoundException } from '@nestjs/common';

describe('SupportService', () => {
  let service: SupportService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new SupportService(prisma as never);
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
        slaResponseDeadline: new Date(),
        slaResolveDeadline: new Date(),
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
      prisma.supportTicket.findUnique.mockResolvedValue({ id: '1' });
      prisma.supportTicket.update.mockResolvedValue({ id: '1', priority: 'P1' });
      await service.update('1', { priority: 'P1' });
      expect(prisma.supportTicket.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            priority: 'P1',
            slaResponseDeadline: expect.any(Date),
            slaResolveDeadline: expect.any(Date),
          }),
        }),
      );
    });
  });

  describe('updateStatus', () => {
    it('updates status', async () => {
      prisma.supportTicket.findUnique.mockResolvedValue({ id: '1' });
      prisma.supportTicket.update.mockResolvedValue({ id: '1', status: 'RESOLVED' });
      const result = await service.updateStatus('1', 'RESOLVED');
      expect(result.status).toBe('RESOLVED');
      expect(result.slaState.state).toBe('CLOSED');
    });
  });

  describe('SLA projection', () => {
    it('marks ticket as breached when resolve deadline passed', async () => {
      prisma.supportTicket.findMany.mockResolvedValue([
        {
          id: 'ticket-1',
          status: 'IN_PROGRESS',
          slaResponseDeadline: new Date('2020-01-01T00:00:00Z'),
          slaResolveDeadline: new Date('2020-01-02T00:00:00Z'),
        },
      ]);

      const result = await service.findAll({});

      expect(result.items[0].slaState.state).toBe('BREACHED');
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
