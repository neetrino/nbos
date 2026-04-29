import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Decimal } from '@nbos/database';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { ClientServiceFlowsService } from './client-service-flows.service';

describe('ClientServiceFlowsService', () => {
  let prisma: MockPrisma;
  let invoicesService: { create: ReturnType<typeof vi.fn> };
  let expensePlansService: { create: ReturnType<typeof vi.fn> };
  let expensesService: { create: ReturnType<typeof vi.fn> };
  let tasksService: { create: ReturnType<typeof vi.fn> };
  let service: ClientServiceFlowsService;

  beforeEach(() => {
    prisma = createMockPrisma();
    invoicesService = { create: vi.fn().mockResolvedValue({ id: 'inv-1' }) };
    expensePlansService = { create: vi.fn().mockResolvedValue({ id: 'plan-1' }) };
    expensesService = { create: vi.fn().mockResolvedValue({ id: 'exp-1' }) };
    tasksService = { create: vi.fn().mockResolvedValue({ id: 'task-1' }) };
    service = new ClientServiceFlowsService(
      prisma as never,
      invoicesService as never,
      expensePlansService as never,
      expensesService as never,
      tasksService as never,
    );
  });

  it('creates linked invoice for client-paid service', async () => {
    prisma.clientServiceRecord.findUnique.mockResolvedValue(
      buildService({ billingModel: 'CLIENT_PAID' }),
    );

    await service.createInvoice('svc-1', {});

    expect(invoicesService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'project-1',
        clientServiceRecordId: 'svc-1',
        amount: 149,
        type: 'SERVICE',
      }),
    );
  });

  it('rejects invoice for company-paid service', async () => {
    prisma.clientServiceRecord.findUnique.mockResolvedValue(
      buildService({ billingModel: 'COMPANY_PAID' }),
    );

    await expect(service.createInvoice('svc-1', {})).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates linked expense plan from service', async () => {
    prisma.clientServiceRecord.findUnique.mockResolvedValue(buildService({ type: 'HOSTING' }));

    await service.createExpensePlan('svc-1', {});

    expect(expensePlansService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'HOSTING',
        clientServiceRecordId: 'svc-1',
        amount: 99,
      }),
    );
  });

  it('creates linked task with service link', async () => {
    prisma.clientServiceRecord.findUnique.mockResolvedValue(buildService({ type: 'DOMAIN' }));

    await service.createTask('svc-1', { creatorId: 'emp-1' });

    expect(tasksService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        creatorId: 'emp-1',
        links: [{ entityType: 'ClientServiceRecord', entityId: 'svc-1' }],
      }),
    );
  });

  it('throws when service is missing', async () => {
    prisma.clientServiceRecord.findUnique.mockResolvedValue(null);

    await expect(service.createExpense('missing', {})).rejects.toBeInstanceOf(NotFoundException);
  });
});

function buildService(overrides: Record<string, unknown> = {}) {
  return {
    id: 'svc-1',
    projectId: 'project-1',
    productId: null,
    type: 'SERVICE',
    name: 'Cloudflare Pro',
    provider: 'Cloudflare',
    providerAccountId: null,
    status: 'ACTIVE',
    billingModel: 'CLIENT_PAID',
    pricingModel: 'FIXED',
    frequency: 'MONTHLY',
    ourCost: new Decimal('99'),
    clientCharge: new Decimal('149'),
    taxStatus: 'TAX',
    notificationsEnabled: true,
    startDate: null,
    renewalDate: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}
