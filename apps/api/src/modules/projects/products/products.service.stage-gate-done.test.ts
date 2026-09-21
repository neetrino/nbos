import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { DEPRECATED_PATCH_STATUS_TERMINAL_AUDIT_ACTION } from '../delivery-status-deprecation';
import {
  createProductsServiceHarness,
  clearProductsServiceHarness,
  type ProductsServiceHarness,
  readExceptionResponse,
  stubProductReadyForDone,
} from './products.service.test-harness';

vi.mock('../../bonus/product-bonus-pool-sync', () => ({
  syncProductBonusPoolForOrder: vi.fn().mockResolvedValue(undefined),
}));

import { syncProductBonusPoolForOrder } from '../../bonus/product-bonus-pool-sync';

describe('ProductsService', () => {
  let service: ProductsServiceHarness['service'];
  let prisma: ProductsServiceHarness['prisma'];
  let notifications: ProductsServiceHarness['notifications'];
  let partnerAccrualClassic: ProductsServiceHarness['partnerAccrualClassic'];
  let partnerAccrualSubscription: ProductsServiceHarness['partnerAccrualSubscription'];
  let auditService: ProductsServiceHarness['auditService'];
  let checklistTemplates: ProductsServiceHarness['checklistTemplates'];

  beforeEach(() => {
    const harness = createProductsServiceHarness();
    clearProductsServiceHarness(harness);
    service = harness.service;
    prisma = harness.prisma;
    notifications = harness.notifications;
    partnerAccrualClassic = harness.partnerAccrualClassic;
    partnerAccrualSubscription = harness.partnerAccrualSubscription;
    auditService = harness.auditService;
    checklistTemplates = harness.checklistTemplates;
  });

  describe('updateStatus — stage gate', () => {
    it('blocks TRANSFER → DONE when a subscription order has an unpaid invoice', async () => {
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
          paymentType: 'SUBSCRIPTION',
          invoices: [{ moneyStatus: 'AWAITING_PAYMENT' }],
        },
      });

      const error = await service
        .updateStatus('p1', 'DONE', 'emp-audit')
        .catch((caught: unknown) => caught);

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
        projectId: 'proj-1',
        status: 'TRANSFER',
        clientAcceptedAt: new Date('2026-04-29T09:00:00.000Z'),
        extensions: [{ status: 'DONE' }, { status: 'LOST' }],
        tasks: [{ status: 'DONE' }, { status: 'ON_HOLD' }],
        tickets: [{ status: 'RESOLVED' }, { status: 'CLOSED' }],
        order: {
          id: 'ord-1',
          status: 'FULLY_PAID',
          paymentType: 'CLASSIC',
          invoices: [{ moneyStatus: 'PAID' }],
        },
      });
      prisma.product.update.mockResolvedValue({ id: 'p1', status: 'DONE' });

      const result = await service.updateStatus('p1', 'DONE', 'emp-audit');

      expect(result.status).toBe('DONE');
      expect(prisma.productAccessSlotBinding.findMany).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: DEPRECATED_PATCH_STATUS_TERMINAL_AUDIT_ACTION,
          entityType: 'PRODUCT',
          entityId: 'p1',
          userId: 'emp-audit',
          projectId: 'proj-1',
          changes: expect.objectContaining({
            targetStatus: 'DONE',
            deliveryResolution: 'DONE',
          }),
        }),
      );
    });

    it('blocks TRANSFER → DONE when required access slots are empty', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        projectId: 'proj-1',
        status: 'TRANSFER',
        productCategory: 'CODE',
        productType: 'COMPANY_WEBSITE',
        clientAcceptedAt: new Date('2026-04-29T09:00:00.000Z'),
        extensions: [{ status: 'DONE' }],
        tasks: [{ status: 'DONE' }],
        tickets: [{ status: 'RESOLVED' }],
        order: {
          id: 'ord-1',
          status: 'FULLY_PAID',
          paymentType: 'CLASSIC',
          invoices: [{ moneyStatus: 'PAID' }],
        },
      });

      const error = await service
        .updateStatus('p1', 'DONE', 'emp-audit')
        .catch((caught: unknown) => caught);

      expect(error).toBeInstanceOf(BadRequestException);
      expect(readExceptionResponse(error)).toMatchObject({
        code: 'STAGE_GATE_VALIDATION',
        errors: [{ field: 'access', message: expect.any(String) }],
      });
      expect(prisma.product.update).not.toHaveBeenCalled();
    });

    it('releases held accruals when product reaches DONE through updateStatus, not complete', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        projectId: 'proj-1',
        status: 'TRANSFER',
        clientAcceptedAt: new Date('2026-04-29T09:00:00.000Z'),
        extensions: [{ status: 'DONE' }],
        tasks: [{ status: 'DONE' }],
        tickets: [{ status: 'RESOLVED' }],
        order: {
          id: 'ord-1',
          status: 'FULLY_PAID',
          paymentType: 'CLASSIC',
          invoices: [{ moneyStatus: 'PAID' }],
        },
      });
      prisma.product.update.mockResolvedValue({ id: 'p1', status: 'DONE' });
      prisma.order.findUnique.mockResolvedValue({ id: 'ord-1' });

      await service.updateStatus('p1', 'DONE', 'emp-audit');

      expect(partnerAccrualSubscription.releaseHeldAccrualsAfterDelivery).toHaveBeenCalledWith(
        'ord-1',
      );
    });

    it('creates classic inbound accrual when product reaches DONE through updateStatus, not complete', async () => {
      stubProductReadyForDone(prisma);

      await service.updateStatus('p1', 'DONE', 'emp-audit');

      expect(partnerAccrualClassic.tryInboundClassicAfterDelivery).toHaveBeenCalledWith('ord-1');
    });

    it('syncs bonus pool when product reaches DONE through updateStatus, not complete', async () => {
      stubProductReadyForDone(prisma);

      await service.updateStatus('p1', 'DONE', 'emp-audit');

      expect(syncProductBonusPoolForOrder).toHaveBeenCalledWith(prisma, 'ord-1', notifications);
    });

    it('cancels held accruals when product reaches LOST through updateStatus', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        projectId: 'proj-1',
        status: 'DEVELOPMENT',
      });
      prisma.product.update.mockResolvedValue({ id: 'p1', status: 'LOST' });
      prisma.order.findUnique.mockResolvedValue({ id: 'ord-1' });

      await service.updateStatus('p1', 'LOST', 'emp-audit');

      expect(partnerAccrualSubscription.cancelHeldAccrualsAfterLostDelivery).toHaveBeenCalledWith(
        'ord-1',
      );
      expect(partnerAccrualSubscription.releaseHeldAccrualsAfterDelivery).not.toHaveBeenCalled();
      expect(partnerAccrualClassic.tryInboundClassicAfterDelivery).not.toHaveBeenCalled();
      expect(syncProductBonusPoolForOrder).not.toHaveBeenCalled();
    });

    it('blocks CREATING → DEVELOPMENT when stage checklist is not complete', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        projectId: 'proj-1',
        status: 'CREATING',
        deadline: new Date('2026-05-20T00:00:00.000Z'),
      });
      checklistTemplates.assertStageInstancesCompleted.mockRejectedValueOnce(
        new BadRequestException({
          code: 'STAGE_GATE_VALIDATION',
          errors: [{ field: 'checklist.stage', message: 'Checklist must be completed.' }],
        }),
      );

      await expect(service.updateStatus('p1', 'DEVELOPMENT', 'emp-audit')).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.product.update).not.toHaveBeenCalled();
    });

    it('allows CREATING → DEVELOPMENT when required stage checklist is complete', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        projectId: 'proj-1',
        status: 'CREATING',
        deadline: new Date('2026-05-20T00:00:00.000Z'),
      });
      prisma.product.update.mockResolvedValue({ id: 'p1', status: 'DEVELOPMENT' });

      const result = await service.updateStatus('p1', 'DEVELOPMENT', 'emp-audit');

      expect(result.status).toBe('DEVELOPMENT');
    });

    it('rejects invalid status string', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 'p1', status: 'NEW' });
      await expect(service.updateStatus('p1', 'INVALID', 'emp-audit')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
