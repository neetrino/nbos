import { vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import type { NotificationService } from '../../notifications/notification.service';
import type { AuditService } from '../../audit/audit.service';
import { syncProductBonusPoolForOrder } from '../../bonus/product-bonus-pool-sync';

export type ProductsServiceHarness = {
  service: ProductsService;
  prisma: MockPrisma;
  notifications: NotificationService;
  partnerAccrualClassic: {
    tryInboundClassicAfterDelivery: ReturnType<typeof vi.fn>;
  };
  partnerAccrualSubscription: {
    releaseHeldAccrualsAfterDelivery: ReturnType<typeof vi.fn>;
    cancelHeldAccrualsAfterLostDelivery: ReturnType<typeof vi.fn>;
  };
  auditService: Pick<AuditService, 'log'>;
  deliveryStageChecklistSync: {
    syncProductAfterLifecycleWrite: ReturnType<typeof vi.fn>;
  };
  checklistTemplates: {
    assertStageInstancesCompleted: ReturnType<typeof vi.fn>;
  };
  productTeamSync: {
    syncProductSlots: ReturnType<typeof vi.fn>;
    syncProductSeller: ReturnType<typeof vi.fn>;
    syncExtensionAssignee: ReturnType<typeof vi.fn>;
  };
  productWhatsApp: {
    ensureGroupForProduct: ReturnType<typeof vi.fn>;
    ensureTechnicalSpecialist: ReturnType<typeof vi.fn>;
  };
};

export function createProductsServiceHarness(): ProductsServiceHarness {
  const prisma = createMockPrisma();
  const notifications = { create: vi.fn() } as unknown as NotificationService;
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
    syncProductAfterLifecycleWrite: vi.fn().mockResolvedValue(undefined),
  };
  const checklistTemplates = {
    assertStageInstancesCompleted: vi.fn().mockResolvedValue(undefined),
  };
  const productTeamSync = {
    syncProductSlots: vi.fn().mockResolvedValue(undefined),
    syncProductSeller: vi.fn().mockResolvedValue(undefined),
    syncExtensionAssignee: vi.fn().mockResolvedValue(undefined),
  };
  const productWhatsApp = {
    ensureGroupForProduct: vi.fn().mockResolvedValue({}),
    ensureTechnicalSpecialist: vi.fn().mockResolvedValue({}),
  };
  const service = new ProductsService(
    prisma as never,
    notifications,
    partnerAccrualClassic as never,
    partnerAccrualSubscription as never,
    auditService as never,
    deliveryStageChecklistSync as never,
    checklistTemplates as never,
    productTeamSync as never,
    productWhatsApp as never,
    { publishItemChanged: vi.fn().mockResolvedValue(undefined) } as never,
  );
  return {
    service,
    prisma,
    notifications,
    partnerAccrualClassic,
    partnerAccrualSubscription,
    auditService,
    deliveryStageChecklistSync,
    checklistTemplates,
    productTeamSync,
    productWhatsApp,
  };
}

export function clearProductsServiceHarness(harness: ProductsServiceHarness): void {
  harness.partnerAccrualClassic.tryInboundClassicAfterDelivery.mockClear();
  vi.mocked(syncProductBonusPoolForOrder).mockClear();
  harness.partnerAccrualSubscription.releaseHeldAccrualsAfterDelivery.mockClear();
  harness.partnerAccrualSubscription.cancelHeldAccrualsAfterLostDelivery.mockClear();
  vi.mocked(harness.auditService.log).mockClear();
  harness.deliveryStageChecklistSync.syncProductAfterLifecycleWrite.mockClear();
  harness.checklistTemplates.assertStageInstancesCompleted.mockClear();
  harness.productTeamSync.syncProductSlots.mockClear();
  harness.productTeamSync.syncProductSeller.mockClear();
  harness.productWhatsApp.ensureGroupForProduct.mockClear();
  harness.productWhatsApp.ensureTechnicalSpecialist.mockClear();
}

export function stubProductReadyForDone(prisma: MockPrisma): void {
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
}

export function readExceptionResponse(error: unknown): object {
  if (!(error instanceof BadRequestException)) return {};
  const response = error.getResponse();
  return typeof response === 'object' && response !== null ? response : {};
}
