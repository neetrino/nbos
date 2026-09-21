import { vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { ExtensionsService } from './extensions.service';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import type { NotificationService } from '../../notifications/notification.service';
import type { AuditService } from '../../audit/audit.service';
import { syncProductBonusPoolForOrder } from '../../bonus/product-bonus-pool-sync';

export type ExtensionsServiceHarness = {
  service: ExtensionsService;
  prisma: MockPrisma;
  notifications: NotificationService;
  supportService: {
    closeLinkedTicketsAfterExtensionDelivered: ReturnType<typeof vi.fn>;
  };
  partnerAccrualClassic: {
    tryInboundClassicAfterDelivery: ReturnType<typeof vi.fn>;
  };
  partnerAccrualSubscription: {
    releaseHeldAccrualsAfterDelivery: ReturnType<typeof vi.fn>;
    cancelHeldAccrualsAfterLostDelivery: ReturnType<typeof vi.fn>;
  };
  auditService: Pick<AuditService, 'log'>;
  deliveryStageChecklistSync: {
    syncExtensionAfterLifecycleWrite: ReturnType<typeof vi.fn>;
  };
  checklistTemplates: {
    assertStageInstancesCompleted: ReturnType<typeof vi.fn>;
  };
  productTeamSync: {
    syncProductSlots: ReturnType<typeof vi.fn>;
    syncExtensionAssignee: ReturnType<typeof vi.fn>;
  };
};

export function createExtensionsServiceHarness(): ExtensionsServiceHarness {
  const prisma = createMockPrisma();
  const notifications = { create: vi.fn() } as unknown as NotificationService;
  const supportService = {
    closeLinkedTicketsAfterExtensionDelivered: vi.fn().mockResolvedValue(undefined),
  };
  const partnerAccrualClassic = {
    tryInboundClassicAfterDelivery: vi.fn().mockResolvedValue(undefined),
  };
  const partnerAccrualSubscription = {
    releaseHeldAccrualsAfterDelivery: vi.fn().mockResolvedValue(undefined),
    cancelHeldAccrualsAfterLostDelivery: vi.fn().mockResolvedValue(undefined),
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
  const productTeamSync = {
    syncProductSlots: vi.fn().mockResolvedValue(undefined),
    syncExtensionAssignee: vi.fn().mockResolvedValue(undefined),
  };
  const service = new ExtensionsService(
    prisma as never,
    notifications,
    partnerAccrualClassic as never,
    partnerAccrualSubscription as never,
    supportService as never,
    auditService as never,
    deliveryStageChecklistSync as never,
    checklistTemplates as never,
    productTeamSync as never,
    { publishItemChanged: vi.fn().mockResolvedValue(undefined) } as never,
  );
  return {
    service,
    prisma,
    notifications,
    supportService,
    partnerAccrualClassic,
    partnerAccrualSubscription,
    auditService,
    deliveryStageChecklistSync,
    checklistTemplates,
    productTeamSync,
  };
}

export function clearExtensionsServiceHarness(harness: ExtensionsServiceHarness): void {
  harness.partnerAccrualClassic.tryInboundClassicAfterDelivery.mockClear();
  vi.mocked(syncProductBonusPoolForOrder).mockClear();
  harness.partnerAccrualSubscription.releaseHeldAccrualsAfterDelivery.mockClear();
  harness.partnerAccrualSubscription.cancelHeldAccrualsAfterLostDelivery.mockClear();
  harness.supportService.closeLinkedTicketsAfterExtensionDelivered.mockClear();
  vi.mocked(harness.auditService.log).mockClear();
  harness.deliveryStageChecklistSync.syncExtensionAfterLifecycleWrite.mockClear();
  harness.checklistTemplates.assertStageInstancesCompleted.mockClear();
  harness.productTeamSync.syncExtensionAssignee.mockClear();
}

export function stubExtensionReadyForDone(prisma: MockPrisma): void {
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
}

export function readExceptionResponse(error: unknown): object {
  if (!(error instanceof BadRequestException)) return {};
  const response = error.getResponse();
  return typeof response === 'object' && response !== null ? response : {};
}
