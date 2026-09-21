import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createExtensionsServiceHarness,
  clearExtensionsServiceHarness,
  type ExtensionsServiceHarness,
} from './extensions.service.test-harness';

vi.mock('../../bonus/product-bonus-pool-sync', () => ({
  syncProductBonusPoolForOrder: vi.fn().mockResolvedValue(undefined),
}));

import { syncProductBonusPoolForOrder } from '../../bonus/product-bonus-pool-sync';

describe('ExtensionsService', () => {
  let service: ExtensionsServiceHarness['service'];
  let prisma: ExtensionsServiceHarness['prisma'];
  let partnerAccrualClassic: ExtensionsServiceHarness['partnerAccrualClassic'];
  let partnerAccrualSubscription: ExtensionsServiceHarness['partnerAccrualSubscription'];
  let auditService: ExtensionsServiceHarness['auditService'];

  beforeEach(() => {
    const harness = createExtensionsServiceHarness();
    clearExtensionsServiceHarness(harness);
    service = harness.service;
    prisma = harness.prisma;
    partnerAccrualClassic = harness.partnerAccrualClassic;
    partnerAccrualSubscription = harness.partnerAccrualSubscription;
    auditService = harness.auditService;
  });

  describe('dedicated delivery actions', () => {
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

    it('cancels held subscription accruals when extension ends LOST via cancel', async () => {
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
      prisma.order.findUnique.mockResolvedValue({ id: 'ord-1' });

      await service.cancel('e1', { reason: 'No longer needed' }, 'user-1');

      expect(partnerAccrualSubscription.cancelHeldAccrualsAfterLostDelivery).toHaveBeenCalledWith(
        'ord-1',
      );
      expect(partnerAccrualSubscription.releaseHeldAccrualsAfterDelivery).not.toHaveBeenCalled();
      expect(partnerAccrualClassic.tryInboundClassicAfterDelivery).not.toHaveBeenCalled();
      expect(syncProductBonusPoolForOrder).not.toHaveBeenCalled();
    });
  });
});
