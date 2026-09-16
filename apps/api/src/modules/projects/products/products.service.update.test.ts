import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProductsService } from './products.service';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { BadRequestException } from '@nestjs/common';
import type { NotificationService } from '../../notifications/notification.service';
import type { AuditService } from '../../audit/audit.service';
import { FRONTEND_REQUIRES_BACKEND_MESSAGE } from './product-developer-slots';

const PRODUCT_ID = 'p1';
const BACKEND_ID = 'be-1';
const FRONTEND_ID = 'fe-1';

function stubFindByIdRow(overrides: Record<string, unknown> = {}) {
  return {
    id: PRODUCT_ID,
    projectId: 'proj-1',
    name: 'Website',
    status: 'CREATING',
    developerId: BACKEND_ID,
    frontendDeveloperId: null,
    technicalSpecialistId: null,
    pmId: null,
    designerId: null,
    qaLeadId: null,
    clientAcceptedAt: null,
    contact: { id: 'c1', firstName: 'A', lastName: 'B' },
    additionalContacts: [],
    project: {
      id: 'proj-1',
      code: 'P-1',
      name: 'Proj',
      credentials: [],
      domains: [],
      _count: { credentials: 0, domains: 0 },
    },
    pm: null,
    developer: null,
    frontendDeveloper: null,
    designer: null,
    technicalSpecialist: null,
    qaLead: null,
    closedBy: null,
    technicalProfiles: [],
    order: null,
    extensions: [],
    tasks: [],
    tickets: [],
    workSpace: null,
    ...overrides,
  };
}

describe('ProductsService.update developer slots', () => {
  let service: ProductsService;
  let prisma: MockPrisma;

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

  beforeEach(() => {
    prisma = createMockPrisma();
    prisma.$queryRaw.mockResolvedValue([{ id: PRODUCT_ID }]);
    service = new ProductsService(
      prisma as never,
      { create: vi.fn() } as unknown as NotificationService,
      partnerAccrualClassic as never,
      partnerAccrualSubscription as never,
      auditService as never,
      deliveryStageChecklistSync as never,
      checklistTemplates as never,
      productTeamSync as never,
      productWhatsApp as never,
      { publishItemChanged: vi.fn().mockResolvedValue(undefined) } as never,
    );
  });

  it('writes after locking and allows the same person on both slots', async () => {
    prisma.product.findUnique.mockResolvedValue(stubFindByIdRow());
    prisma.product.findUniqueOrThrow.mockResolvedValue({
      developerId: BACKEND_ID,
      frontendDeveloperId: null,
    });

    await service.update(PRODUCT_ID, { frontendDeveloperId: BACKEND_ID });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.product.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: PRODUCT_ID },
        data: expect.objectContaining({ frontendDeveloperId: BACKEND_ID }),
      }),
    );
  });

  it('rejects a Frontend-only patch when the locked row has no Backend', async () => {
    prisma.product.findUnique.mockResolvedValue(
      stubFindByIdRow({ developerId: BACKEND_ID, frontendDeveloperId: null }),
    );
    prisma.product.findUniqueOrThrow.mockResolvedValue({
      developerId: null,
      frontendDeveloperId: null,
    });

    await expect(service.update(PRODUCT_ID, { frontendDeveloperId: FRONTEND_ID })).rejects.toThrow(
      FRONTEND_REQUIRES_BACKEND_MESSAGE,
    );
    expect(prisma.product.update).not.toHaveBeenCalled();
  });

  it('rejects clearing Backend while Frontend remains set on the locked row', async () => {
    prisma.product.findUnique.mockResolvedValue(
      stubFindByIdRow({ developerId: BACKEND_ID, frontendDeveloperId: FRONTEND_ID }),
    );
    prisma.product.findUniqueOrThrow.mockResolvedValue({
      developerId: BACKEND_ID,
      frontendDeveloperId: FRONTEND_ID,
    });

    await expect(service.update(PRODUCT_ID, { developerId: null })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.product.update).not.toHaveBeenCalled();
  });
});
