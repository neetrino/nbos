import { BadRequestException } from '@nestjs/common';
import { Decimal } from '@nbos/database';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import {
  buildRenewalInvoiceEligibleWhere,
  hasInvoiceForRenewalPeriod,
  runClientServicesRenewalInvoices,
} from './client-services-renewal-invoice';
import {
  CLIENT_SERVICE_INVOICE_OVERDUE_GRACE_DAYS,
  CLIENT_SERVICE_RENEWAL_INVOICE_WINDOW_DAYS,
} from './client-service-payment-stage';
import type { ClientServiceFlowsService } from './client-service-flows.service';

const AS_OF = new Date('2026-06-01T12:00:00.000Z');
const RENEWAL = new Date('2026-07-01T00:00:00.000Z');

describe('hasInvoiceForRenewalPeriod', () => {
  it('returns true when an active invoice exists', () => {
    expect(
      hasInvoiceForRenewalPeriod(
        [{ moneyStatus: 'AWAITING_PAYMENT', createdAt: AS_OF, dueDate: RENEWAL }],
        RENEWAL,
      ),
    ).toBe(true);
  });

  it('returns true when a paid invoice was created in the renewal window', () => {
    expect(
      hasInvoiceForRenewalPeriod(
        [{ moneyStatus: 'PAID', createdAt: AS_OF, dueDate: RENEWAL }],
        RENEWAL,
      ),
    ).toBe(true);
  });

  it('returns false when only a paid invoice for a prior renewal exists', () => {
    const priorCreated = new Date('2025-06-01T00:00:00.000Z');
    expect(
      hasInvoiceForRenewalPeriod(
        [{ moneyStatus: 'PAID', createdAt: priorCreated, dueDate: priorCreated }],
        RENEWAL,
      ),
    ).toBe(false);
  });

  it('treats paid create+15 dueDate after renewal as the same period', () => {
    const created = new Date('2026-06-20T00:00:00.000Z');
    const dueAfterRenewal = new Date('2026-07-05T00:00:00.000Z');
    expect(
      hasInvoiceForRenewalPeriod(
        [{ moneyStatus: 'PAID', createdAt: created, dueDate: dueAfterRenewal }],
        RENEWAL,
      ),
    ).toBe(true);
  });

  it('ignores cancelled invoices', () => {
    expect(
      hasInvoiceForRenewalPeriod(
        [{ moneyStatus: 'CANCELLED', createdAt: AS_OF, dueDate: RENEWAL }],
        RENEWAL,
      ),
    ).toBe(false);
  });
});

describe('buildRenewalInvoiceEligibleWhere', () => {
  it('targets WE_PAY services within the renewal window', () => {
    const where = buildRenewalInvoiceEligibleWhere(AS_OF);
    expect(where).toEqual(
      expect.objectContaining({
        billingModel: 'WE_PAY',
        status: { not: 'CANCELLED' },
        renewalDate: expect.objectContaining({ not: null }),
      }),
    );
    expect(CLIENT_SERVICE_RENEWAL_INVOICE_WINDOW_DAYS).toBe(60);
  });
});

describe('runClientServicesRenewalInvoices', () => {
  let prisma: MockPrisma;
  let flows: { createInvoice: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    prisma = createMockPrisma();
    flows = { createInvoice: vi.fn().mockResolvedValue({ id: 'inv-new' }) };
  });

  it('creates invoice for eligible WE_PAY service without existing renewal invoice', async () => {
    prisma.clientServiceRecord.findMany.mockResolvedValue([buildEligibleService({ invoices: [] })]);

    const result = await runClientServicesRenewalInvoices(
      prisma as never,
      flows as never as ClientServiceFlowsService,
      { asOf: AS_OF.toISOString() },
    );

    expect(result.created).toEqual([{ serviceId: 'svc-1', invoiceId: 'inv-new' }]);
    expect(result.skippedExisting).toBe(0);
    const expectedDue = new Date(AS_OF);
    expectedDue.setUTCDate(expectedDue.getUTCDate() + CLIENT_SERVICE_INVOICE_OVERDUE_GRACE_DAYS);
    expect(flows.createInvoice).toHaveBeenCalledWith(
      'svc-1',
      expect.objectContaining({
        amount: 149,
        type: 'SERVICE',
        dueDate: expectedDue.toISOString(),
      }),
    );
  });

  it('skips REMINDER_ONLY services because they are not queried', async () => {
    prisma.clientServiceRecord.findMany.mockResolvedValue([]);

    const result = await runClientServicesRenewalInvoices(prisma as never, flows as never);

    expect(result.created).toEqual([]);
    expect(flows.createInvoice).not.toHaveBeenCalled();
  });

  it('is idempotent when an active invoice already exists', async () => {
    prisma.clientServiceRecord.findMany.mockResolvedValue([
      buildEligibleService({
        invoices: [{ moneyStatus: 'AWAITING_PAYMENT', createdAt: AS_OF, dueDate: RENEWAL }],
      }),
    ]);

    const result = await runClientServicesRenewalInvoices(prisma as never, flows as never);

    expect(result.created).toEqual([]);
    expect(result.skippedExisting).toBe(1);
    expect(flows.createInvoice).not.toHaveBeenCalled();
  });

  it('records failures for invalid client charge without aborting the batch', async () => {
    prisma.clientServiceRecord.findMany.mockResolvedValue([
      buildEligibleService({ clientCharge: new Decimal(0), invoices: [] }),
      buildEligibleService({ id: 'svc-2', invoices: [] }),
    ]);
    flows.createInvoice.mockResolvedValueOnce({ id: 'inv-2' });

    const result = await runClientServicesRenewalInvoices(prisma as never, flows as never);

    expect(result.failures).toHaveLength(1);
    expect(result.failures[0]?.serviceId).toBe('svc-1');
    expect(result.created).toEqual([{ serviceId: 'svc-2', invoiceId: 'inv-2' }]);
  });
});

function buildEligibleService(
  overrides: {
    id?: string;
    clientCharge?: Decimal;
    invoices?: Array<{ moneyStatus: string; dueDate: Date | null; createdAt?: Date }>;
  } = {},
) {
  return {
    id: overrides.id ?? 'svc-1',
    projectId: 'project-1',
    type: 'HOSTING' as const,
    name: 'Acme hosting',
    renewalDate: RENEWAL,
    clientCharge: overrides.clientCharge ?? new Decimal(149),
    invoices: overrides.invoices ?? [],
  };
}

describe('runClientServicesRenewalInvoices createInvoice errors', () => {
  it('surfaces BadRequestException as failure row', async () => {
    const prisma = createMockPrisma();
    const flows = {
      createInvoice: vi.fn().mockRejectedValue(new BadRequestException('Only we-pay')),
    };
    prisma.clientServiceRecord.findMany.mockResolvedValue([
      {
        id: 'svc-1',
        projectId: 'project-1',
        type: 'HOSTING',
        name: 'Test',
        renewalDate: RENEWAL,
        clientCharge: new Decimal(100),
        invoices: [],
      },
    ]);

    const result = await runClientServicesRenewalInvoices(
      prisma as never,
      flows as never as ClientServiceFlowsService,
    );

    expect(result.failures[0]?.message).toContain('we-pay');
  });
});
