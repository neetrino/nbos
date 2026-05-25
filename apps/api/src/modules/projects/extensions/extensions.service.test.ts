import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExtensionsService } from './extensions.service';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { EXTENSION_STAGE_GATE_ERROR_CODE } from './extension-stage-gates';
import type { NotificationService } from '../../notifications/notification.service';
import type { AuditService } from '../../audit/audit.service';
import { DEPRECATED_PATCH_STATUS_TERMINAL_AUDIT_ACTION } from '../delivery-status-deprecation';

describe('ExtensionsService', () => {
  let service: ExtensionsService;
  let prisma: MockPrisma;
  let notifications: NotificationService;
  const supportService = {
    closeLinkedTicketsAfterExtensionDelivered: vi.fn().mockResolvedValue(undefined),
  };

  const partnerAccrualClassic = {
    tryInboundClassicAfterDelivery: vi.fn().mockResolvedValue(undefined),
  };

  const auditService: Pick<AuditService, 'log'> = {
    log: vi.fn().mockResolvedValue(undefined),
  };

  const deliveryStageChecklistSync = {
    syncExtensionAfterLifecycleWrite: vi.fn().mockResolvedValue(undefined),
  };
  const checklistTemplates = {
    assertStageInstancesCompleted: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    prisma = createMockPrisma();
    notifications = { create: vi.fn() } as unknown as NotificationService;
    partnerAccrualClassic.tryInboundClassicAfterDelivery.mockClear();
    supportService.closeLinkedTicketsAfterExtensionDelivered.mockClear();
    vi.mocked(auditService.log).mockClear();
    deliveryStageChecklistSync.syncExtensionAfterLifecycleWrite.mockClear();
    checklistTemplates.assertStageInstancesCompleted.mockClear();
    service = new ExtensionsService(
      prisma as never,
      notifications,
      partnerAccrualClassic as never,
      supportService as never,
      auditService as never,
      deliveryStageChecklistSync as never,
      checklistTemplates as never,
    );
  });

  describe('findAll', () => {
    it('returns paginated empty list', async () => {
      const result = await service.findAll({});
      expect(result.items).toEqual([]);
      expect(result.meta.totalPages).toBe(0);
    });

    it('attaches readiness metadata', async () => {
      prisma.extension.findMany.mockResolvedValue([
        {
          id: 'e1',
          status: 'NEW',
          description: null,
          assignedTo: null,
          order: null,
        },
      ]);

      const result = await service.findAll({});

      expect(result.items[0]).toMatchObject({
        readiness: {
          isReadyForDevelopment: false,
          missing: [
            { field: 'description', message: expect.any(String) },
            { field: 'assignedTo', message: expect.any(String) },
          ],
        },
      });
    });

    it('applies projectId filter', async () => {
      await service.findAll({ projectId: 'proj-1' });
      expect(prisma.extension.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ projectId: 'proj-1' }),
        }),
      );
    });

    it('applies companyId filter on related project', async () => {
      await service.findAll({ companyId: 'comp-1' });
      expect(prisma.extension.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            project: { is: { companyId: 'comp-1' } },
          }),
        }),
      );
    });

    it('applies productId filter', async () => {
      await service.findAll({ productId: 'prod-1' });
      expect(prisma.extension.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ productId: 'prod-1' }),
        }),
      );
    });

    it('applies status filter', async () => {
      await service.findAll({ status: 'DEVELOPMENT' });
      expect(prisma.extension.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'DEVELOPMENT' }),
        }),
      );
    });

    it('applies canonical lifecycle filters', async () => {
      await service.findAll({
        deliveryStage: 'TRANSFER',
        deliveryWorkStatus: 'ACTIVE',
        deliveryResolution: 'CANCELLED',
      });

      expect(prisma.extension.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deliveryStage: 'TRANSFER',
            deliveryWorkStatus: 'ACTIVE',
            deliveryResolution: 'CANCELLED',
          }),
        }),
      );
    });

    it('applies size filter', async () => {
      await service.findAll({ size: 'LARGE' });
      expect(prisma.extension.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ size: 'LARGE' }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('throws NotFoundException when not found', async () => {
      await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
    });

    it('returns extension when found', async () => {
      prisma.extension.findUnique.mockResolvedValue({
        id: 'e1',
        name: 'Feature X',
        status: 'LOST',
      });
      const result = await service.findById('e1');
      expect(result.name).toBe('Feature X');
      expect(result.deliveryLifecycle).toMatchObject({
        resolution: 'CANCELLED',
        isTerminal: true,
      });
    });
  });

  describe('create', () => {
    it('requires a linked product', async () => {
      await expect(
        service.create({
          projectId: 'proj-1',
          productId: '',
          name: 'Add login',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.extension.create).not.toHaveBeenCalled();
    });

    it('creates extension with required product link', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 'prod-1', projectId: 'proj-1' });
      prisma.extension.create.mockResolvedValue({
        id: 'e1',
        name: 'Add login',
        size: 'SMALL',
      });
      const result = await service.create({
        projectId: 'proj-1',
        productId: 'prod-1',
        name: 'Add login',
      });
      expect(result.size).toBe('SMALL');
    });

    it('creates extension with product link', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 'prod-1', projectId: 'proj-1' });
      prisma.extension.create.mockResolvedValue({ id: 'e1', name: 'Feature' });
      await service.create({
        projectId: 'proj-1',
        productId: 'prod-1',
        name: 'Feature',
        size: 'MEDIUM',
        assignedTo: 'dev-1',
      });
      expect(prisma.extension.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            productId: 'prod-1',
            size: 'MEDIUM',
            assignedTo: 'dev-1',
          }),
        }),
      );
    });

    it('rejects product from another project', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 'prod-2', projectId: 'other-project' });

      await expect(
        service.create({
          projectId: 'proj-1',
          productId: 'prod-2',
          name: 'Feature',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.extension.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('rejects attempts to remove linked product', async () => {
      prisma.extension.findUnique.mockResolvedValue({
        id: 'e1',
        projectId: 'proj-1',
        productId: 'prod-1',
      });

      const payload = { productId: null } as unknown as Parameters<typeof service.update>[1];

      await expect(service.update('e1', payload)).rejects.toThrow(BadRequestException);
      expect(prisma.extension.update).not.toHaveBeenCalled();
    });

    it('allows relinking to product from the same project', async () => {
      prisma.extension.findUnique.mockResolvedValue({
        id: 'e1',
        projectId: 'proj-1',
        productId: 'prod-1',
      });
      prisma.product.findUnique.mockResolvedValue({ id: 'prod-2', projectId: 'proj-1' });
      prisma.extension.update.mockResolvedValue({
        id: 'e1',
        projectId: 'proj-1',
        productId: 'prod-2',
      });

      await service.update('e1', { productId: 'prod-2' });

      expect(prisma.extension.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ productId: 'prod-2' }),
        }),
      );
    });
  });

  describe('updateStatus — stage gate', () => {
    it('requires description, assignee, and order for NEW → DEVELOPMENT', async () => {
      prisma.extension.findUnique.mockResolvedValue({
        id: 'e1',
        status: 'NEW',
        description: null,
        assignedTo: null,
        order: null,
      });

      await expect(service.updateStatus('e1', 'DEVELOPMENT', 'emp-audit')).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.extension.update).not.toHaveBeenCalled();
    });

    it('returns structured readiness blockers for NEW → DEVELOPMENT', async () => {
      prisma.extension.findUnique.mockResolvedValue({
        id: 'e1',
        status: 'NEW',
        description: '',
        assignedTo: null,
        order: null,
      });

      const error = await service
        .updateStatus('e1', 'DEVELOPMENT', 'emp-audit')
        .catch((caught: unknown) => caught);

      expect(error).toBeInstanceOf(BadRequestException);
      expect(readExceptionResponse(error)).toMatchObject({
        code: EXTENSION_STAGE_GATE_ERROR_CODE,
        errors: [
          { field: 'description', message: expect.any(String) },
          { field: 'assignedTo', message: expect.any(String) },
        ],
      });
      expect(prisma.extension.update).not.toHaveBeenCalled();
    });

    it('allows NEW → DEVELOPMENT', async () => {
      prisma.extension.findUnique.mockResolvedValue({
        id: 'e1',
        status: 'NEW',
        description: 'Add loyalty widget',
        assignedTo: 'dev-1',
        order: { id: 'ord-1' },
      });
      prisma.extension.update.mockResolvedValue({ id: 'e1', status: 'DEVELOPMENT' });
      const result = await service.updateStatus('e1', 'DEVELOPMENT', 'emp-audit');
      expect(result.status).toBe('DEVELOPMENT');
    });

    it('allows QA → TRANSFER', async () => {
      prisma.extension.findUnique.mockResolvedValue({ id: 'e1', status: 'QA' });
      prisma.extension.update.mockResolvedValue({ id: 'e1', status: 'TRANSFER' });
      const result = await service.updateStatus('e1', 'TRANSFER', 'emp-audit');
      expect(result.status).toBe('TRANSFER');
    });

    it('rejects DONE → DEVELOPMENT (terminal state)', async () => {
      prisma.extension.findUnique.mockResolvedValue({ id: 'e1', status: 'DONE' });
      await expect(service.updateStatus('e1', 'DEVELOPMENT', 'emp-audit')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects NEW → QA (skip not allowed)', async () => {
      prisma.extension.findUnique.mockResolvedValue({ id: 'e1', status: 'NEW' });
      await expect(service.updateStatus('e1', 'QA', 'emp-audit')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('allows any → LOST', async () => {
      prisma.extension.findUnique.mockResolvedValue({
        id: 'e1',
        projectId: 'proj-1',
        status: 'DEVELOPMENT',
      });
      prisma.extension.update.mockResolvedValue({ id: 'e1', status: 'LOST' });
      const result = await service.updateStatus('e1', 'LOST', 'emp-audit');
      expect(result.status).toBe('LOST');
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: DEPRECATED_PATCH_STATUS_TERMINAL_AUDIT_ACTION,
          entityType: 'EXTENSION',
          entityId: 'e1',
          userId: 'emp-audit',
          projectId: 'proj-1',
          changes: expect.objectContaining({
            deprecatedApiPath: 'PATCH /projects/extensions/:id/status',
            targetStatus: 'LOST',
          }),
        }),
      );
    });

    it('allows QA → DEVELOPMENT (back for fixes)', async () => {
      prisma.extension.findUnique.mockResolvedValue({ id: 'e1', status: 'QA' });
      prisma.extension.update.mockResolvedValue({ id: 'e1', status: 'DEVELOPMENT' });
      const result = await service.updateStatus('e1', 'DEVELOPMENT', 'emp-audit');
      expect(result.status).toBe('DEVELOPMENT');
    });

    it('blocks TRANSFER → DONE when extension tasks are still open', async () => {
      prisma.extension.findUnique.mockResolvedValue({
        id: 'e1',
        status: 'TRANSFER',
        tasks: [{ status: 'IN_PROGRESS' }, { status: 'DONE' }],
      });

      const error = await service
        .updateStatus('e1', 'DONE', 'emp-audit')
        .catch((caught: unknown) => caught);

      expect(error).toBeInstanceOf(BadRequestException);
      expect(readExceptionResponse(error)).toMatchObject({
        code: EXTENSION_STAGE_GATE_ERROR_CODE,
        errors: [{ field: 'tasks', message: expect.any(String) }],
      });
      expect(prisma.extension.update).not.toHaveBeenCalled();
    });

    it('allows TRANSFER → DONE when extension tasks are closed', async () => {
      prisma.extension.findUnique.mockResolvedValue({
        id: 'e1',
        projectId: 'proj-1',
        status: 'TRANSFER',
        tasks: [{ status: 'DONE' }, { status: 'COMPLETED' }],
        order: { id: 'ord-1', status: 'FULLY_PAID', invoices: [{ moneyStatus: 'PAID' }] },
      });
      prisma.extension.update.mockResolvedValue({ id: 'e1', status: 'DONE' });

      const result = await service.updateStatus('e1', 'DONE', 'emp-audit');

      expect(result.status).toBe('DONE');
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: DEPRECATED_PATCH_STATUS_TERMINAL_AUDIT_ACTION,
          entityType: 'EXTENSION',
          entityId: 'e1',
          userId: 'emp-audit',
          projectId: 'proj-1',
          changes: expect.objectContaining({ targetStatus: 'DONE', deliveryResolution: 'DONE' }),
        }),
      );
    });

    it('blocks TRANSFER → DONE when linked order is not fully paid', async () => {
      prisma.extension.findUnique.mockResolvedValue({
        id: 'e1',
        status: 'TRANSFER',
        tasks: [{ status: 'DONE' }],
        order: { id: 'ord-1', status: 'PARTIALLY_PAID', invoices: [{ moneyStatus: 'PAID' }] },
      });

      const error = await service
        .updateStatus('e1', 'DONE', 'emp-audit')
        .catch((caught: unknown) => caught);

      expect(error).toBeInstanceOf(BadRequestException);
      expect(readExceptionResponse(error)).toMatchObject({
        code: EXTENSION_STAGE_GATE_ERROR_CODE,
        errors: [{ field: 'finance', message: expect.stringContaining('Order PARTIALLY_PAID') }],
      });
      expect(prisma.extension.update).not.toHaveBeenCalled();
    });
  });

  describe('dedicated delivery actions', () => {
    it('moves extension to a canonical stage through stage-specific action', async () => {
      prisma.extension.findUnique.mockResolvedValue({
        id: 'e1',
        status: 'NEW',
        description: 'Add loyalty widget',
        assignedTo: 'dev-1',
        order: { id: 'ord-1' },
      });
      prisma.extension.update.mockResolvedValue({
        id: 'e1',
        status: 'DEVELOPMENT',
        deliveryStage: 'DEVELOPMENT',
        deliveryWorkStatus: 'ACTIVE',
      });

      const result = await service.moveStage('e1', { stage: 'DEVELOPMENT' });

      expect(prisma.extension.update).toHaveBeenCalledWith(
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

    it('blocks stage movement while extension is paused', async () => {
      prisma.extension.findUnique.mockResolvedValue({
        id: 'e1',
        status: 'QA',
        deliveryStage: 'QA',
        deliveryWorkStatus: 'ON_HOLD',
      });

      await expect(service.moveStage('e1', { stage: 'TRANSFER' })).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.extension.update).not.toHaveBeenCalled();
    });

    it('completes extension delivery through dedicated action', async () => {
      prisma.extension.findUnique.mockResolvedValue({
        id: 'e1',
        projectId: 'proj-1',
        status: 'TRANSFER',
        deliveryStage: 'TRANSFER',
        deliveryWorkStatus: 'ACTIVE',
      });
      prisma.extension.update.mockResolvedValue({
        id: 'e1',
        status: 'DONE',
        deliveryStage: null,
        deliveryWorkStatus: 'ACTIVE',
        deliveryResolution: 'DONE',
      });

      const result = await service.complete('e1', 'user-1');

      expect(supportService.closeLinkedTicketsAfterExtensionDelivered).toHaveBeenCalledWith(
        'e1',
        'user-1',
      );
      expect(prisma.extension.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'DONE',
            deliveryStage: null,
            deliveryWorkStatus: 'ACTIVE',
            deliveryResolution: 'DONE',
            closedById: 'user-1',
          }),
        }),
      );
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'EXTENSION',
          entityId: 'e1',
          action: 'delivery.completed',
        }),
      );
      expect(result.deliveryLifecycle.resolution).toBe('DONE');
    });

    it('blocks completion while extension is paused', async () => {
      prisma.extension.findUnique.mockResolvedValue({
        id: 'e1',
        status: 'TRANSFER',
        deliveryStage: 'TRANSFER',
        deliveryWorkStatus: 'ON_HOLD',
      });

      await expect(service.complete('e1', 'user-1')).rejects.toThrow(BadRequestException);
      expect(prisma.extension.update).not.toHaveBeenCalled();
    });

    it('pauses extension delivery without changing legacy stage status', async () => {
      prisma.extension.findUnique.mockResolvedValue({ id: 'e1', status: 'QA' });
      prisma.extension.update.mockResolvedValue({
        id: 'e1',
        status: 'QA',
        deliveryStage: 'QA',
        deliveryWorkStatus: 'ON_HOLD',
        onHoldReason: 'Waiting for client',
        onHoldUntil: new Date('2026-05-01T00:00:00.000Z'),
      });

      const result = await service.pause('e1', {
        reason: 'Waiting for client',
        onHoldUntil: '2026-05-01T00:00:00.000Z',
      });

      expect(prisma.extension.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            deliveryStage: 'QA',
            deliveryWorkStatus: 'ON_HOLD',
            onHoldReason: 'Waiting for client',
          }),
        }),
      );
      expect(result.status).toBe('QA');
      expect(result.deliveryLifecycle.workStatus).toBe('ON_HOLD');
    });

    it('resumes extension delivery to the saved canonical stage', async () => {
      prisma.extension.findUnique.mockResolvedValue({
        id: 'e1',
        status: 'QA',
        deliveryStage: 'QA',
        deliveryWorkStatus: 'ON_HOLD',
      });
      prisma.extension.update.mockResolvedValue({
        id: 'e1',
        status: 'QA',
        deliveryStage: 'QA',
        deliveryWorkStatus: 'ACTIVE',
      });

      const result = await service.resume('e1');

      expect(prisma.extension.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'QA',
            deliveryWorkStatus: 'ACTIVE',
            onHoldReason: null,
            onHoldUntil: null,
          }),
        }),
      );
      expect(result.deliveryLifecycle.workStatus).toBe('ACTIVE');
    });

    it('cancels extension delivery with a reason', async () => {
      prisma.extension.findUnique.mockResolvedValue({
        id: 'e1',
        projectId: 'proj-1',
        status: 'DEVELOPMENT',
      });
      prisma.extension.update.mockResolvedValue({
        id: 'e1',
        status: 'LOST',
        deliveryResolution: 'CANCELLED',
        cancellationReason: 'No longer needed',
      });

      const result = await service.cancel('e1', { reason: 'No longer needed' }, 'user-1');

      expect(prisma.extension.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'LOST',
            deliveryStage: null,
            deliveryResolution: 'CANCELLED',
            cancellationReason: 'No longer needed',
            closedById: 'user-1',
          }),
        }),
      );
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'EXTENSION',
          action: 'delivery.cancelled',
        }),
      );
      expect(result.deliveryLifecycle.resolution).toBe('CANCELLED');
    });
  });

  describe('delete', () => {
    it('deletes when found', async () => {
      prisma.extension.findUnique.mockResolvedValue({ id: 'e1' });
      await service.delete('e1');
      expect(prisma.extension.delete).toHaveBeenCalledWith({ where: { id: 'e1' } });
    });
  });

  describe('getStats', () => {
    it('returns stats', async () => {
      prisma.extension.count.mockResolvedValue(3);
      const stats = await service.getStats();
      expect(stats.total).toBe(3);
    });
  });
});

function readExceptionResponse(error: unknown) {
  if (!(error instanceof BadRequestException)) return {};
  const response = error.getResponse();
  return typeof response === 'object' && response !== null ? response : {};
}
