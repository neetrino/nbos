import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { EXTENSION_STAGE_GATE_ERROR_CODE } from './extension-stage-gates';
import { DEPRECATED_PATCH_STATUS_TERMINAL_AUDIT_ACTION } from '../delivery-status-deprecation';
import {
  createExtensionsServiceHarness,
  clearExtensionsServiceHarness,
  type ExtensionsServiceHarness,
  readExceptionResponse,
  stubExtensionReadyForDone,
} from './extensions.service.test-harness';

vi.mock('../../bonus/product-bonus-pool-sync', () => ({
  syncProductBonusPoolForOrder: vi.fn().mockResolvedValue(undefined),
}));

import { syncProductBonusPoolForOrder } from '../../bonus/product-bonus-pool-sync';

describe('ExtensionsService', () => {
  let service: ExtensionsServiceHarness['service'];
  let prisma: ExtensionsServiceHarness['prisma'];
  let notifications: ExtensionsServiceHarness['notifications'];
  let partnerAccrualClassic: ExtensionsServiceHarness['partnerAccrualClassic'];
  let partnerAccrualSubscription: ExtensionsServiceHarness['partnerAccrualSubscription'];
  let auditService: ExtensionsServiceHarness['auditService'];

  beforeEach(() => {
    const harness = createExtensionsServiceHarness();
    clearExtensionsServiceHarness(harness);
    service = harness.service;
    prisma = harness.prisma;
    notifications = harness.notifications;
    partnerAccrualClassic = harness.partnerAccrualClassic;
    partnerAccrualSubscription = harness.partnerAccrualSubscription;
    auditService = harness.auditService;
  });

  describe('updateStatus — stage gate', () => {
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
        order: {
          id: 'ord-1',
          status: 'FULLY_PAID',
          paymentType: 'CLASSIC',
          invoices: [{ moneyStatus: 'PAID' }],
        },
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

    it('releases held accruals when extension reaches DONE through updateStatus, not complete', async () => {
      prisma.extension.findUnique.mockResolvedValue({
        id: 'e1',
        projectId: 'proj-1',
        status: 'TRANSFER',
        tasks: [{ status: 'DONE' }, { status: 'COMPLETED' }],
        order: {
          id: 'ord-1',
          status: 'FULLY_PAID',
          paymentType: 'CLASSIC',
          invoices: [{ moneyStatus: 'PAID' }],
        },
      });
      prisma.extension.update.mockResolvedValue({ id: 'e1', status: 'DONE' });
      prisma.order.findUnique.mockResolvedValue({ id: 'ord-1' });

      await service.updateStatus('e1', 'DONE', 'emp-audit');

      expect(partnerAccrualSubscription.releaseHeldAccrualsAfterDelivery).toHaveBeenCalledWith(
        'ord-1',
      );
    });

    it('creates classic inbound accrual when extension reaches DONE through updateStatus, not complete', async () => {
      stubExtensionReadyForDone(prisma);

      await service.updateStatus('e1', 'DONE', 'emp-audit');

      expect(partnerAccrualClassic.tryInboundClassicAfterDelivery).toHaveBeenCalledWith('ord-1');
    });

    it('syncs bonus pool when extension reaches DONE through updateStatus, not complete', async () => {
      stubExtensionReadyForDone(prisma);

      await service.updateStatus('e1', 'DONE', 'emp-audit');

      expect(syncProductBonusPoolForOrder).toHaveBeenCalledWith(prisma, 'ord-1', notifications);
    });

    it('cancels held accruals when extension reaches LOST through updateStatus', async () => {
      prisma.extension.findUnique.mockResolvedValue({
        id: 'e1',
        projectId: 'proj-1',
        status: 'DEVELOPMENT',
      });
      prisma.extension.update.mockResolvedValue({ id: 'e1', status: 'LOST' });
      prisma.order.findUnique.mockResolvedValue({ id: 'ord-1' });

      await service.updateStatus('e1', 'LOST', 'emp-audit');

      expect(partnerAccrualSubscription.cancelHeldAccrualsAfterLostDelivery).toHaveBeenCalledWith(
        'ord-1',
      );
      expect(partnerAccrualSubscription.releaseHeldAccrualsAfterDelivery).not.toHaveBeenCalled();
      expect(partnerAccrualClassic.tryInboundClassicAfterDelivery).not.toHaveBeenCalled();
      expect(syncProductBonusPoolForOrder).not.toHaveBeenCalled();
    });

    it('blocks TRANSFER → DONE when linked CLASSIC order is not fully paid', async () => {
      prisma.extension.findUnique.mockResolvedValue({
        id: 'e1',
        status: 'TRANSFER',
        tasks: [{ status: 'DONE' }],
        order: {
          id: 'ord-1',
          status: 'PARTIALLY_PAID',
          paymentType: 'CLASSIC',
          invoices: [{ moneyStatus: 'PAID' }],
        },
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

    it('regression: allows TRANSFER → DONE when a subscription order is PARTIALLY_PAID and no invoices are unpaid', async () => {
      prisma.extension.findUnique.mockResolvedValue({
        id: 'e1',
        projectId: 'proj-1',
        status: 'TRANSFER',
        tasks: [{ status: 'DONE' }, { status: 'COMPLETED' }],
        order: {
          id: 'ord-1',
          status: 'PARTIALLY_PAID',
          paymentType: 'SUBSCRIPTION',
          invoices: [{ moneyStatus: 'PAID' }],
        },
      });
      prisma.extension.update.mockResolvedValue({ id: 'e1', status: 'DONE' });

      const result = await service.updateStatus('e1', 'DONE', 'emp-audit');

      expect(result.status).toBe('DONE');
      expect(prisma.extension.update).toHaveBeenCalled();
    });

    it('blocks TRANSFER → DONE when a subscription order has an unpaid invoice', async () => {
      prisma.extension.findUnique.mockResolvedValue({
        id: 'e1',
        status: 'TRANSFER',
        tasks: [{ status: 'DONE' }],
        order: {
          id: 'ord-1',
          status: 'PARTIALLY_PAID',
          paymentType: 'SUBSCRIPTION',
          invoices: [{ moneyStatus: 'AWAITING_PAYMENT' }],
        },
      });

      const error = await service
        .updateStatus('e1', 'DONE', 'emp-audit')
        .catch((caught: unknown) => caught);

      expect(error).toBeInstanceOf(BadRequestException);
      expect(readExceptionResponse(error)).toMatchObject({
        code: EXTENSION_STAGE_GATE_ERROR_CODE,
        errors: [{ field: 'finance', message: expect.any(String) }],
      });
      expect(prisma.extension.update).not.toHaveBeenCalled();
    });
  });
});
