import { BadRequestException } from '@nestjs/common';
import { Decimal } from '@nbos/database';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import {
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
});
