import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProductsService } from './products.service';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import type { NotificationService } from '../../notifications/notification.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: MockPrisma;
  let notifications: NotificationService;

  beforeEach(() => {
    prisma = createMockPrisma();
    notifications = { create: vi.fn() } as unknown as NotificationService;
    service = new ProductsService(prisma as never, notifications);
  });

  describe('findAll', () => {
    it('returns paginated empty list', async () => {
      const result = await service.findAll({});
      expect(result.items).toEqual([]);
      expect(result.meta.totalPages).toBe(0);
    });

    it('applies projectId filter', async () => {
      await service.findAll({ projectId: 'proj-1' });
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ projectId: 'proj-1' }),
        }),
      );
    });

    it('applies status filter', async () => {
      await service.findAll({ status: 'DEVELOPMENT' });
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'DEVELOPMENT' }),
        }),
      );
    });

    it('applies canonical lifecycle filters', async () => {
      await service.findAll({
        deliveryStage: 'QA',
        deliveryWorkStatus: 'ON_HOLD',
        deliveryResolution: 'DONE',
      });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deliveryStage: 'QA',
            deliveryWorkStatus: 'ON_HOLD',
            deliveryResolution: 'DONE',
          }),
        }),
      );
    });

    it('applies productType filter', async () => {
      await service.findAll({ productType: 'COMPANY_WEBSITE' });
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ productType: 'COMPANY_WEBSITE' }),
        }),
      );
    });

    it('applies search filter', async () => {
      await service.findAll({ search: 'site' });
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: { contains: 'site', mode: 'insensitive' },
          }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('throws NotFoundException when not found', async () => {
      await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
    });

    it('returns product when found', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        name: 'Test',
        status: 'CREATING',
        clientAcceptedAt: new Date('2026-04-29T09:00:00.000Z'),
        project: {
          credentials: [{ category: 'HOSTING' }],
          domains: [{ status: 'ACTIVE' }],
          _count: { credentials: 1, domains: 1 },
        },
        order: {
          status: 'FULLY_PAID',
          deal: {
            offerFileUrl: 'https://cdn.example.com/offer.pdf',
            contractFileUrl: 'https://cdn.example.com/contract.pdf',
          },
          invoices: [{ status: 'PAID' }],
        },
        extensions: [{ status: 'DONE' }],
        tasks: [{ status: 'DONE' }],
        tickets: [{ status: 'RESOLVED' }],
      });
      const result = await service.findById('p1');
      expect(result.name).toBe('Test');
      expect(result.deliveryLifecycle).toMatchObject({
        stage: 'STARTING',
        workStatus: 'ACTIVE',
      });
      expect(result.doneReadiness).toMatchObject({
        canCompleteWithRuntimeData: true,
        blockers: [],
        warnings: [],
        missingRuntimeSignals: [{ code: 'DELIVERY_FILE_LINK_RUNTIME_MISSING' }],
        summary: {
          approvedOfferFilePresent: true,
          clientAccepted: true,
          contractFilePresent: true,
          handoffCredentialCount: 1,
        },
      });
    });

    it('surfaces Done readiness blockers and missing documentation', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        name: 'Test',
        status: 'TRANSFER',
        project: { credentials: [], domains: [], _count: { credentials: 0, domains: 0 } },
        order: { status: 'PARTIALLY_PAID', deal: null, invoices: [{ status: 'WAITING' }] },
        extensions: [{ status: 'DEVELOPMENT' }],
        tasks: [{ status: 'IN_PROGRESS' }],
        tickets: [{ status: 'NEW' }],
      });

      const result = await service.findById('p1');

      expect(result.doneReadiness).toMatchObject({
        canCompleteWithRuntimeData: false,
        summary: {
          credentialCount: 0,
          approvedOfferFilePresent: false,
          clientAccepted: false,
          contractFilePresent: false,
          deliveryFileRuntimeAvailable: false,
          domainCount: 0,
          expiredDomainCount: 0,
          expiringDomainCount: 0,
          handoffCredentialCount: 0,
          openExtensionCount: 1,
          openTaskCount: 1,
          openTicketCount: 1,
          unpaidInvoiceCount: 1,
        },
      });
      expect(result.doneReadiness.blockers.map((item) => item.code)).toEqual(
        expect.arrayContaining([
          'OPEN_EXTENSIONS',
          'OPEN_TASKS',
          'OPEN_TICKETS',
          'CLIENT_ACCEPTANCE_MISSING',
          'UNPAID_INVOICES',
          'ORDER_NOT_CLOSED',
        ]),
      );
      expect(result.doneReadiness.warnings.map((item) => item.code)).toEqual([
        'NO_PROJECT_CREDENTIALS',
        'NO_PROJECT_DOMAINS',
        'NO_APPROVED_OFFER_FILE',
        'NO_CONTRACT_FILE',
      ]);
    });

    it('surfaces handoff credential and domain readiness', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        name: 'Test',
        status: 'TRANSFER',
        clientAcceptedAt: new Date('2026-04-29T09:00:00.000Z'),
        project: {
          credentials: [{ category: 'OTHER' }],
          domains: [{ status: 'EXPIRED' }, { status: 'EXPIRING_SOON' }],
          _count: { credentials: 1, domains: 2 },
        },
        order: {
          status: 'FULLY_PAID',
          deal: {
            offerFileUrl: 'https://cdn.example.com/offer.pdf',
            contractFileUrl: 'https://cdn.example.com/contract.pdf',
          },
          invoices: [{ status: 'PAID' }],
        },
        extensions: [{ status: 'DONE' }],
        tasks: [{ status: 'DONE' }],
        tickets: [{ status: 'RESOLVED' }],
      });

      const result = await service.findById('p1');

      expect(result.doneReadiness).toMatchObject({
        canCompleteWithRuntimeData: false,
        summary: {
          expiredDomainCount: 1,
          expiringDomainCount: 1,
          handoffCredentialCount: 0,
        },
      });
      expect(result.doneReadiness.blockers.map((item) => item.code)).toEqual(['EXPIRED_DOMAINS']);
      expect(result.doneReadiness.warnings.map((item) => item.code)).toEqual([
        'NO_HANDOFF_CREDENTIALS',
        'EXPIRING_DOMAINS',
      ]);
    });

    it('surfaces missing Drive handoff files without blocking runtime completion', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        name: 'Test',
        status: 'TRANSFER',
        clientAcceptedAt: new Date('2026-04-29T09:00:00.000Z'),
        project: {
          credentials: [{ category: 'HOSTING' }],
          domains: [{ status: 'ACTIVE' }],
          _count: { credentials: 1, domains: 1 },
        },
        order: {
          status: 'FULLY_PAID',
          deal: { offerFileUrl: null, contractFileUrl: null },
          invoices: [{ status: 'PAID' }],
        },
        extensions: [{ status: 'DONE' }],
        tasks: [{ status: 'DONE' }],
        tickets: [{ status: 'RESOLVED' }],
      });

      const result = await service.findById('p1');

      expect(result.doneReadiness).toMatchObject({
        canCompleteWithRuntimeData: true,
        summary: {
          approvedOfferFilePresent: false,
          contractFilePresent: false,
          deliveryFileRuntimeAvailable: false,
        },
      });
      expect(result.doneReadiness.warnings.map((item) => item.code)).toEqual([
        'NO_APPROVED_OFFER_FILE',
        'NO_CONTRACT_FILE',
      ]);
      expect(result.doneReadiness.missingRuntimeSignals.map((item) => item.code)).toEqual([
        'DELIVERY_FILE_LINK_RUNTIME_MISSING',
      ]);
    });
  });

  describe('create', () => {
    it('creates product with required fields', async () => {
      prisma.product.create.mockResolvedValue({
        id: 'p1',
        name: 'Website',
        productCategory: 'CODE',
        productType: 'COMPANY_WEBSITE',
      });
      const result = await service.create({
        projectId: 'proj-1',
        name: 'Website',
        productCategory: 'CODE',
        productType: 'COMPANY_WEBSITE',
      });
      expect(result.productType).toBe('COMPANY_WEBSITE');
    });

    it('creates product with optional fields', async () => {
      prisma.product.create.mockResolvedValue({ id: 'p1', name: 'App' });
      await service.create({
        projectId: 'proj-1',
        name: 'App',
        productCategory: 'CODE',
        productType: 'MOBILE_APP',
        pmId: 'pm-1',
        deadline: '2026-12-31',
        description: 'Mobile app',
      });
      expect(prisma.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            pmId: 'pm-1',
            description: 'Mobile app',
          }),
        }),
      );
    });
  });

  describe('updateStatus — stage gate', () => {
    it('requires description, deadline, and order for NEW → CREATING', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        status: 'NEW',
        description: null,
        deadline: null,
        order: null,
      });

      await expect(service.updateStatus('p1', 'CREATING')).rejects.toThrow(BadRequestException);
      expect(prisma.product.update).not.toHaveBeenCalled();
    });

    it('allows NEW → CREATING', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        status: 'NEW',
        description: 'Website scope',
        deadline: new Date('2026-06-01'),
        order: { id: 'ord-1' },
      });
      prisma.product.update.mockResolvedValue({ id: 'p1', status: 'CREATING' });
      const result = await service.updateStatus('p1', 'CREATING');
      expect(result.status).toBe('CREATING');
    });

    it('blocks DEVELOPMENT → QA when product tasks are still open', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        status: 'DEVELOPMENT',
        tasks: [{ status: 'IN_PROGRESS' }, { status: 'DONE' }],
      });

      const error = await service.updateStatus('p1', 'QA').catch((caught: unknown) => caught);

      expect(error).toBeInstanceOf(BadRequestException);
      expect(readExceptionResponse(error)).toMatchObject({
        code: 'STAGE_GATE_VALIDATION',
        errors: [{ field: 'tasks', message: expect.any(String) }],
      });
      expect(prisma.product.update).not.toHaveBeenCalled();
    });

    it('allows DEVELOPMENT → QA when product tasks are closed', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        status: 'DEVELOPMENT',
        tasks: [{ status: 'DONE' }, { status: 'DEFERRED' }],
      });
      prisma.product.update.mockResolvedValue({ id: 'p1', status: 'QA' });
      const result = await service.updateStatus('p1', 'QA');
      expect(result.status).toBe('QA');
    });

    it('blocks QA → TRANSFER when QA tasks are still open', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        status: 'QA',
        tasks: [{ status: 'IN_PROGRESS' }, { status: 'DONE' }],
      });

      const error = await service.updateStatus('p1', 'TRANSFER').catch((caught: unknown) => caught);

      expect(error).toBeInstanceOf(BadRequestException);
      expect(readExceptionResponse(error)).toMatchObject({
        code: 'STAGE_GATE_VALIDATION',
        errors: [{ field: 'tasks', message: expect.any(String) }],
      });
      expect(prisma.product.update).not.toHaveBeenCalled();
    });

    it('allows QA → TRANSFER when QA tasks are closed', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        status: 'QA',
        tasks: [{ status: 'DONE' }, { status: 'CANCELLED' }],
      });
      prisma.product.update.mockResolvedValue({ id: 'p1', status: 'TRANSFER' });
      const result = await service.updateStatus('p1', 'TRANSFER');
      expect(result.status).toBe('TRANSFER');
    });

    it('rejects DONE → CREATING (terminal state)', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 'p1', status: 'DONE' });
      await expect(service.updateStatus('p1', 'CREATING')).rejects.toThrow(BadRequestException);
    });

    it('rejects NEW → QA (skip not allowed)', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 'p1', status: 'NEW' });
      await expect(service.updateStatus('p1', 'QA')).rejects.toThrow(BadRequestException);
    });

    it('allows any → LOST', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 'p1', status: 'DEVELOPMENT' });
      prisma.product.update.mockResolvedValue({ id: 'p1', status: 'LOST' });
      const result = await service.updateStatus('p1', 'LOST');
      expect(result.status).toBe('LOST');
    });

    it('allows ON_HOLD → back to any active stage', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        projectId: 'proj-1',
        status: 'ON_HOLD',
      });
      prisma.projectKickoffChecklistItem.findMany.mockResolvedValue([
        {
          key: 'scope_confirmed',
          title: 'Scope confirmed',
          isRequired: true,
          isChecked: true,
        },
      ]);
      prisma.product.update.mockResolvedValue({ id: 'p1', status: 'DEVELOPMENT' });
      const result = await service.updateStatus('p1', 'DEVELOPMENT');
      expect(result.status).toBe('DEVELOPMENT');
    });

    it('blocks TRANSFER → DONE when delivery items are still open', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        status: 'TRANSFER',
        clientAcceptedAt: new Date('2026-04-29T09:00:00.000Z'),
        extensions: [{ status: 'DEVELOPMENT' }],
        tasks: [{ status: 'IN_PROGRESS' }],
        tickets: [{ status: 'NEW' }],
      });

      const error = await service.updateStatus('p1', 'DONE').catch((caught: unknown) => caught);

      expect(error).toBeInstanceOf(BadRequestException);
      expect(readExceptionResponse(error)).toMatchObject({
        code: 'STAGE_GATE_VALIDATION',
        errors: [
          { field: 'extensions', message: expect.any(String) },
          { field: 'tasks', message: expect.any(String) },
          { field: 'tickets', message: expect.any(String) },
        ],
      });
      expect(prisma.product.update).not.toHaveBeenCalled();
    });

    it('blocks TRANSFER → DONE when order invoices are unpaid', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        status: 'TRANSFER',
        clientAcceptedAt: new Date('2026-04-29T09:00:00.000Z'),
        extensions: [{ status: 'DONE' }],
        tasks: [{ status: 'DONE' }],
        tickets: [{ status: 'RESOLVED' }],
        order: {
          id: 'ord-1',
          status: 'FULLY_PAID',
          invoices: [{ status: 'PAID' }, { status: 'WAITING' }],
        },
      });

      const error = await service.updateStatus('p1', 'DONE').catch((caught: unknown) => caught);

      expect(error).toBeInstanceOf(BadRequestException);
      expect(readExceptionResponse(error)).toMatchObject({
        code: 'STAGE_GATE_VALIDATION',
        errors: [{ field: 'finance', message: expect.any(String) }],
      });
      expect(prisma.product.update).not.toHaveBeenCalled();
    });

    it('blocks TRANSFER → DONE when linked order is not fully paid', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        status: 'TRANSFER',
        clientAcceptedAt: new Date('2026-04-29T09:00:00.000Z'),
        extensions: [{ status: 'DONE' }],
        tasks: [{ status: 'DONE' }],
        tickets: [{ status: 'RESOLVED' }],
        order: {
          id: 'ord-1',
          status: 'PARTIALLY_PAID',
          invoices: [{ status: 'PAID' }],
        },
      });

      const error = await service.updateStatus('p1', 'DONE').catch((caught: unknown) => caught);

      expect(error).toBeInstanceOf(BadRequestException);
      expect(readExceptionResponse(error)).toMatchObject({
        code: 'STAGE_GATE_VALIDATION',
        errors: [{ field: 'finance', message: expect.any(String) }],
      });
      expect(prisma.product.update).not.toHaveBeenCalled();
    });

    it('allows TRANSFER → DONE when delivery items are closed', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        status: 'TRANSFER',
        clientAcceptedAt: new Date('2026-04-29T09:00:00.000Z'),
        extensions: [{ status: 'DONE' }, { status: 'LOST' }],
        tasks: [{ status: 'DONE' }, { status: 'DEFERRED' }],
        tickets: [{ status: 'RESOLVED' }, { status: 'CLOSED' }],
        order: {
          id: 'ord-1',
          status: 'FULLY_PAID',
          invoices: [{ status: 'PAID' }],
        },
      });
      prisma.product.update.mockResolvedValue({ id: 'p1', status: 'DONE' });

      const result = await service.updateStatus('p1', 'DONE');

      expect(result.status).toBe('DONE');
    });

    it('blocks CREATING → DEVELOPMENT when kickoff checklist has missing required items', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        projectId: 'proj-1',
        status: 'CREATING',
      });
      prisma.projectKickoffChecklistItem.findMany.mockResolvedValue([
        {
          key: 'scope_confirmed',
          title: 'Scope confirmed',
          isRequired: true,
          isChecked: false,
        },
      ]);

      await expect(service.updateStatus('p1', 'DEVELOPMENT')).rejects.toThrow(BadRequestException);
      expect(prisma.product.update).not.toHaveBeenCalled();
    });

    it('allows CREATING → DEVELOPMENT when required kickoff checklist is accepted', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        projectId: 'proj-1',
        status: 'CREATING',
      });
      prisma.projectKickoffChecklistItem.findMany.mockResolvedValue([
        {
          key: 'scope_confirmed',
          title: 'Scope confirmed',
          isRequired: true,
          isChecked: true,
        },
      ]);
      prisma.product.update.mockResolvedValue({ id: 'p1', status: 'DEVELOPMENT' });

      const result = await service.updateStatus('p1', 'DEVELOPMENT');

      expect(result.status).toBe('DEVELOPMENT');
    });

    it('rejects invalid status string', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 'p1', status: 'NEW' });
      await expect(service.updateStatus('p1', 'INVALID')).rejects.toThrow(BadRequestException);
    });
  });

  describe('dedicated delivery actions', () => {
    it('moves product to a canonical stage through stage-specific action', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        projectId: 'proj-1',
        status: 'CREATING',
      });
      prisma.projectKickoffChecklistItem.findMany.mockResolvedValue([
        {
          key: 'scope_confirmed',
          title: 'Scope confirmed',
          isRequired: true,
          isChecked: true,
        },
      ]);
      prisma.product.update.mockResolvedValue({
        id: 'p1',
        status: 'DEVELOPMENT',
        deliveryStage: 'DEVELOPMENT',
        deliveryWorkStatus: 'ACTIVE',
      });

      const result = await service.moveStage('p1', { stage: 'DEVELOPMENT' });

      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'DEVELOPMENT',
            deliveryStage: 'DEVELOPMENT',
            deliveryWorkStatus: 'ACTIVE',
          }),
        }),
      );
      expect(result.deliveryLifecycle.stage).toBe('DEVELOPMENT');
    });

    it('blocks stage movement while product is paused', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        status: 'ON_HOLD',
        deliveryStage: 'DEVELOPMENT',
        deliveryWorkStatus: 'ON_HOLD',
      });

      await expect(service.moveStage('p1', { stage: 'QA' })).rejects.toThrow(BadRequestException);
      expect(prisma.product.update).not.toHaveBeenCalled();
    });

    it('completes product delivery through dedicated action', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        status: 'TRANSFER',
        deliveryStage: 'TRANSFER',
        deliveryWorkStatus: 'ACTIVE',
        clientAcceptedAt: new Date('2026-04-29T09:00:00.000Z'),
        extensions: [],
        tasks: [],
        tickets: [],
        order: { status: 'FULLY_PAID', invoices: [] },
      });
      prisma.product.update.mockResolvedValue({
        id: 'p1',
        status: 'DONE',
        deliveryStage: null,
        deliveryWorkStatus: 'ACTIVE',
        deliveryResolution: 'DONE',
      });

      const result = await service.complete('p1');

      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'DONE',
            deliveryStage: null,
            deliveryWorkStatus: 'ACTIVE',
            deliveryResolution: 'DONE',
          }),
        }),
      );
      expect(result.deliveryLifecycle.resolution).toBe('DONE');
    });

    it('blocks completion until client acceptance is recorded', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        status: 'TRANSFER',
        deliveryStage: 'TRANSFER',
        deliveryWorkStatus: 'ACTIVE',
        extensions: [],
        tasks: [],
        tickets: [],
        order: { status: 'FULLY_PAID', invoices: [] },
      });

      const error = await service.complete('p1').catch((caught: unknown) => caught);

      expect(error).toBeInstanceOf(BadRequestException);
      expect(readExceptionResponse(error)).toMatchObject({
        code: 'STAGE_GATE_VALIDATION',
        errors: [{ field: 'clientAcceptance', message: expect.any(String) }],
      });
      expect(prisma.product.update).not.toHaveBeenCalled();
    });

    it('records client acceptance for active product delivery', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        status: 'TRANSFER',
        deliveryStage: 'TRANSFER',
        deliveryWorkStatus: 'ACTIVE',
      });
      prisma.product.update.mockResolvedValue({
        id: 'p1',
        status: 'TRANSFER',
        clientAcceptedAt: new Date('2026-04-29T09:00:00.000Z'),
        clientAcceptedBy: 'Client PM',
        clientAcceptanceNote: 'Approved after handoff call',
      });

      const result = await service.confirmAcceptance('p1', {
        acceptedBy: ' Client PM ',
        note: ' Approved after handoff call ',
      });

      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            clientAcceptedAt: expect.any(Date),
            clientAcceptedBy: 'Client PM',
            clientAcceptanceNote: 'Approved after handoff call',
          }),
        }),
      );
      expect(result.clientAcceptedBy).toBe('Client PM');
    });

    it('blocks completion while product is paused', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        status: 'ON_HOLD',
        deliveryStage: 'TRANSFER',
        deliveryWorkStatus: 'ON_HOLD',
      });

      await expect(service.complete('p1')).rejects.toThrow(BadRequestException);
      expect(prisma.product.update).not.toHaveBeenCalled();
    });

    it('pauses product delivery with canonical hold fields', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 'p1', status: 'DEVELOPMENT' });
      prisma.product.update.mockResolvedValue({
        id: 'p1',
        status: 'ON_HOLD',
        deliveryStage: 'DEVELOPMENT',
        deliveryWorkStatus: 'ON_HOLD',
        deliveryResolution: null,
        onHoldReason: 'Waiting for client',
        onHoldUntil: new Date('2026-05-01T00:00:00.000Z'),
      });

      const result = await service.pause('p1', {
        reason: 'Waiting for client',
        onHoldUntil: '2026-05-01T00:00:00.000Z',
      });

      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'ON_HOLD',
            deliveryStage: 'DEVELOPMENT',
            deliveryWorkStatus: 'ON_HOLD',
            onHoldReason: 'Waiting for client',
          }),
        }),
      );
      expect(result.deliveryLifecycle.workStatus).toBe('ON_HOLD');
    });

    it('resumes product delivery to the saved canonical stage', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        status: 'ON_HOLD',
        deliveryStage: 'QA',
        deliveryWorkStatus: 'ON_HOLD',
      });
      prisma.product.update.mockResolvedValue({
        id: 'p1',
        status: 'QA',
        deliveryStage: 'QA',
        deliveryWorkStatus: 'ACTIVE',
      });

      const result = await service.resume('p1');

      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'QA',
            deliveryWorkStatus: 'ACTIVE',
            onHoldReason: null,
            onHoldUntil: null,
          }),
        }),
      );
      expect(result.status).toBe('QA');
    });

    it('cancels product delivery with a reason', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 'p1', status: 'DEVELOPMENT' });
      prisma.product.update.mockResolvedValue({
        id: 'p1',
        status: 'LOST',
        deliveryResolution: 'CANCELLED',
        cancellationReason: 'Scope cancelled',
      });

      const result = await service.cancel('p1', { reason: 'Scope cancelled' });

      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'LOST',
            deliveryStage: null,
            deliveryResolution: 'CANCELLED',
            cancellationReason: 'Scope cancelled',
          }),
        }),
      );
      expect(result.deliveryLifecycle.resolution).toBe('CANCELLED');
    });
  });

  describe('delete', () => {
    it('deletes when found', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 'p1' });
      await service.delete('p1');
      expect(prisma.product.delete).toHaveBeenCalledWith({ where: { id: 'p1' } });
    });
  });

  describe('getStats', () => {
    it('returns stats without filter', async () => {
      prisma.product.count.mockResolvedValue(5);
      const stats = await service.getStats();
      expect(stats.total).toBe(5);
    });

    it('returns stats with projectId filter', async () => {
      prisma.product.count.mockResolvedValue(2);
      const stats = await service.getStats('proj-1');
      expect(stats.total).toBe(2);
    });
  });
});

function readExceptionResponse(error: unknown) {
  if (!(error instanceof BadRequestException)) return {};
  const response = error.getResponse();
  return typeof response === 'object' && response !== null ? response : {};
}
