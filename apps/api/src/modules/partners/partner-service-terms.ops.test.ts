import { BadRequestException } from '@nestjs/common';
import { Decimal } from '@nbos/database';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import {
  createFinanceFromPartnerServiceTerm,
  createPartnerServiceTerm,
  listPartnerServiceTerms,
  updatePartnerServiceTerm,
} from './partner-service-terms.ops';

describe('partner service terms ops', () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
  });

  it('creates outbound service term for monthly model', async () => {
    prisma.partnerServiceTerm.create.mockResolvedValue({
      id: 'pst-1',
      partnerId: 'p1',
      clientContactId: null,
      clientCompanyId: null,
      projectId: null,
      serviceType: 'SMM',
      paymentModel: 'MONTHLY',
      amount: new Decimal('25000'),
      billingStartDate: new Date('2026-06-01T00:00:00.000Z'),
      subscriptionId: null,
      invoiceId: null,
      status: 'PENDING',
      notes: null,
      createdAt: new Date('2026-05-05T00:00:00.000Z'),
      updatedAt: new Date('2026-05-05T00:00:00.000Z'),
    });

    const result = await createPartnerServiceTerm(prisma as never, 'p1', {
      serviceType: 'smm',
      paymentModel: 'monthly',
      amount: 25000,
      billingStartDate: '2026-06-01T00:00:00.000Z',
    });

    expect(prisma.partnerServiceTerm.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          partnerId: 'p1',
          serviceType: 'SMM',
          paymentModel: 'MONTHLY',
        }),
      }),
    );
    expect(result.amount).toBe('25000.00');
  });

  it('rejects monthly payment model without billingStartDate', async () => {
    await expect(
      createPartnerServiceTerm(prisma as never, 'p1', {
        serviceType: 'SEO',
        paymentModel: 'MONTHLY',
        amount: 1000,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('lists and serializes partner service terms', async () => {
    prisma.partnerServiceTerm.findMany.mockResolvedValue([
      {
        id: 'pst-1',
        partnerId: 'p1',
        clientContactId: 'c1',
        clientCompanyId: null,
        projectId: 'pr1',
        serviceType: 'ADS',
        paymentModel: 'ONE_TIME',
        amount: new Decimal('120000'),
        billingStartDate: null,
        subscriptionId: null,
        invoiceId: 'inv1',
        status: 'ACTIVE',
        notes: 'agreed',
        createdAt: new Date('2026-05-05T00:00:00.000Z'),
        updatedAt: new Date('2026-05-05T00:00:00.000Z'),
      },
    ]);

    const rows = await listPartnerServiceTerms(prisma as never, 'p1');
    expect(rows[0]).toMatchObject({
      id: 'pst-1',
      amount: '120000.00',
      serviceType: 'ADS',
      paymentModel: 'ONE_TIME',
      status: 'ACTIVE',
    });
  });

  it('updates service term with status and billing date', async () => {
    prisma.partnerServiceTerm.findUnique.mockResolvedValue({
      id: 'pst-1',
      partnerId: 'p1',
      clientContactId: null,
      clientCompanyId: null,
      projectId: null,
      serviceType: 'OTHER',
      paymentModel: 'CUSTOM',
      amount: new Decimal('1'),
      billingStartDate: null,
      subscriptionId: null,
      invoiceId: null,
      status: 'PENDING',
      notes: null,
      createdAt: new Date('2026-05-05T00:00:00.000Z'),
      updatedAt: new Date('2026-05-05T00:00:00.000Z'),
    });
    prisma.partnerServiceTerm.update.mockResolvedValue({
      id: 'pst-1',
      partnerId: 'p1',
      clientContactId: null,
      clientCompanyId: null,
      projectId: null,
      serviceType: 'OTHER',
      paymentModel: 'MONTHLY',
      amount: new Decimal('3000'),
      billingStartDate: new Date('2026-07-01T00:00:00.000Z'),
      subscriptionId: null,
      invoiceId: null,
      status: 'ACTIVE',
      notes: null,
      createdAt: new Date('2026-05-05T00:00:00.000Z'),
      updatedAt: new Date('2026-05-06T00:00:00.000Z'),
    });

    const row = await updatePartnerServiceTerm(prisma as never, 'p1', 'pst-1', {
      paymentModel: 'MONTHLY',
      billingStartDate: '2026-07-01T00:00:00.000Z',
      amount: 3000,
      status: 'ACTIVE',
    });
    expect(row.status).toBe('ACTIVE');
    expect(row.paymentModel).toBe('MONTHLY');
  });

  it('creates service invoice for one-time term and links invoiceId', async () => {
    prisma.partnerServiceTerm.findUnique.mockResolvedValue({
      id: 'pst-2',
      partnerId: 'p1',
      clientContactId: null,
      clientCompanyId: 'co-1',
      projectId: 'pr-1',
      serviceType: 'SEO',
      paymentModel: 'ONE_TIME',
      amount: new Decimal('45000'),
      billingStartDate: null,
      subscriptionId: null,
      invoiceId: null,
      status: 'PENDING',
      notes: null,
      createdAt: new Date('2026-05-05T00:00:00.000Z'),
      updatedAt: new Date('2026-05-05T00:00:00.000Z'),
    });
    prisma.invoice.findFirst.mockResolvedValue({ code: 'INV-2026-0007' });
    prisma.company.findUnique.mockResolvedValue({ taxStatus: 'TAX' });
    prisma.invoice.create.mockResolvedValue({ id: 'inv-new' });
    prisma.partnerServiceTerm.update.mockResolvedValue({
      id: 'pst-2',
      partnerId: 'p1',
      clientContactId: null,
      clientCompanyId: 'co-1',
      projectId: 'pr-1',
      serviceType: 'SEO',
      paymentModel: 'ONE_TIME',
      amount: new Decimal('45000'),
      billingStartDate: null,
      subscriptionId: null,
      invoiceId: 'inv-new',
      status: 'ACTIVE',
      notes: null,
      createdAt: new Date('2026-05-05T00:00:00.000Z'),
      updatedAt: new Date('2026-05-06T00:00:00.000Z'),
    });

    const row = await createFinanceFromPartnerServiceTerm(prisma as never, 'p1', 'pst-2', {});
    expect(prisma.invoice.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          projectId: 'pr-1',
          type: 'SERVICE',
          amount: new Decimal('45000'),
        }),
      }),
    );
    expect(row.invoiceId).toBe('inv-new');
    expect(row.status).toBe('ACTIVE');
  });

  it('creates partner service subscription for monthly term and links subscriptionId', async () => {
    prisma.partnerServiceTerm.findUnique.mockResolvedValue({
      id: 'pst-3',
      partnerId: 'p1',
      clientContactId: null,
      clientCompanyId: null,
      projectId: 'pr-2',
      serviceType: 'ADS',
      paymentModel: 'MONTHLY',
      amount: new Decimal('18000'),
      billingStartDate: new Date('2026-06-15T00:00:00.000Z'),
      subscriptionId: null,
      invoiceId: null,
      status: 'PENDING',
      notes: null,
      createdAt: new Date('2026-05-05T00:00:00.000Z'),
      updatedAt: new Date('2026-05-05T00:00:00.000Z'),
    });
    prisma.subscription.findFirst.mockResolvedValue({ code: 'SUB-2026-0010' });
    prisma.subscription.create.mockResolvedValue({ id: 'sub-new' });
    prisma.partnerServiceTerm.update.mockResolvedValue({
      id: 'pst-3',
      partnerId: 'p1',
      clientContactId: null,
      clientCompanyId: null,
      projectId: 'pr-2',
      serviceType: 'ADS',
      paymentModel: 'MONTHLY',
      amount: new Decimal('18000'),
      billingStartDate: new Date('2026-06-15T00:00:00.000Z'),
      subscriptionId: 'sub-new',
      invoiceId: null,
      status: 'ACTIVE',
      notes: null,
      createdAt: new Date('2026-05-05T00:00:00.000Z'),
      updatedAt: new Date('2026-05-06T00:00:00.000Z'),
    });

    const row = await createFinanceFromPartnerServiceTerm(prisma as never, 'p1', 'pst-3', {});
    expect(prisma.subscription.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          projectId: 'pr-2',
          type: 'PARTNER_SERVICE',
          partnerId: 'p1',
        }),
      }),
    );
    expect(row.subscriptionId).toBe('sub-new');
  });
});
