import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
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
  let notifications: ExtensionsServiceHarness['notifications'];
  let supportService: ExtensionsServiceHarness['supportService'];
  let partnerAccrualClassic: ExtensionsServiceHarness['partnerAccrualClassic'];
  let partnerAccrualSubscription: ExtensionsServiceHarness['partnerAccrualSubscription'];
  let auditService: ExtensionsServiceHarness['auditService'];

  beforeEach(() => {
    const harness = createExtensionsServiceHarness();
    clearExtensionsServiceHarness(harness);
    service = harness.service;
    prisma = harness.prisma;
    notifications = harness.notifications;
    supportService = harness.supportService;
    partnerAccrualClassic = harness.partnerAccrualClassic;
    partnerAccrualSubscription = harness.partnerAccrualSubscription;
    auditService = harness.auditService;
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

    it('releases held subscription accruals when a linked order exists', async () => {
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
      prisma.order.findUnique.mockResolvedValue({ id: 'ord-1' });

      await service.complete('e1', 'user-1');

      expect(partnerAccrualClassic.tryInboundClassicAfterDelivery).toHaveBeenCalledWith('ord-1');
      expect(syncProductBonusPoolForOrder).toHaveBeenCalledWith(prisma, 'ord-1', notifications);
      expect(partnerAccrualSubscription.releaseHeldAccrualsAfterDelivery).toHaveBeenCalledWith(
        'ord-1',
      );
    });

    it('still fires classic accrual and bonus-pool sync from complete', async () => {
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
      prisma.order.findUnique.mockResolvedValue({ id: 'ord-1' });

      await service.complete('e1', 'user-1');

      expect(partnerAccrualClassic.tryInboundClassicAfterDelivery).toHaveBeenCalledWith('ord-1');
      expect(syncProductBonusPoolForOrder).toHaveBeenCalledWith(prisma, 'ord-1', notifications);
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
  });
});
