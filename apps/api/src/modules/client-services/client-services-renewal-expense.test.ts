import { Decimal } from '@nbos/database';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import {
  buildRenewalExpenseEligibleWhere,
  findRenewalCycleInvoice,
  runClientServicesRenewalExpenses,
} from './client-services-renewal-expense';
import { CLIENT_SERVICE_RENEWAL_EXPENSE_WINDOW_DAYS } from './client-service-payment-stage';
import type { ClientServiceFlowsService } from './client-service-flows.service';

const AS_OF = new Date('2026-06-15T12:00:00.000Z');
const RENEWAL = new Date('2026-07-01T00:00:00.000Z');

describe('findRenewalCycleInvoice', () => {
  it('prefers an open invoice over last year’s paid invoice', () => {
    const cycle = findRenewalCycleInvoice(
      [
        {
          id: 'inv-old',
          moneyStatus: 'PAID',
          createdAt: new Date('2025-06-01T00:00:00.000Z'),
          dueDate: new Date('2025-07-01T00:00:00.000Z'),
          amount: 40,
        },
        {
          id: 'inv-open',
          moneyStatus: 'AWAITING_PAYMENT',
          createdAt: AS_OF,
          dueDate: RENEWAL,
          amount: 40,
        },
      ],
      RENEWAL,
    );
    expect(cycle?.id).toBe('inv-open');
  });

  it('does not treat a prior-year paid invoice as this cycle', () => {
    expect(
      findRenewalCycleInvoice(
        [
          {
            id: 'inv-old',
            moneyStatus: 'PAID',
            createdAt: new Date('2025-06-01T00:00:00.000Z'),
            dueDate: new Date('2025-07-01T00:00:00.000Z'),
            amount: 40,
          },
        ],
        RENEWAL,
      ),
    ).toBeUndefined();
  });
});

describe('buildRenewalExpenseEligibleWhere', () => {
  it('targets WE_PAY services in the D−30 window', () => {
    const where = buildRenewalExpenseEligibleWhere(AS_OF);
    expect(where).toEqual(
      expect.objectContaining({
        billingModel: 'WE_PAY',
        status: { not: 'CANCELLED' },
        renewalDate: expect.objectContaining({ not: null }),
      }),
    );
    expect(CLIENT_SERVICE_RENEWAL_EXPENSE_WINDOW_DAYS).toBe(30);
  });
});

describe('runClientServicesRenewalExpenses', () => {
  let prisma: MockPrisma;
  let flows: { createExpense: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    prisma = createMockPrisma();
    flows = { createExpense: vi.fn().mockResolvedValue({ id: 'exp-new' }) };
    prisma.expense.findMany.mockResolvedValue([]);
  });

  it('creates an expense for an unpaid cycle invoice inside D−30', async () => {
    prisma.clientServiceRecord.findMany.mockResolvedValue([eligibleService()]);

    const result = await runClientServicesRenewalExpenses(
      prisma as never,
      flows as never as ClientServiceFlowsService,
      { asOf: AS_OF.toISOString() },
    );

    expect(result.created).toEqual([
      { serviceId: 'svc-1', invoiceId: 'inv-1', expenseId: 'exp-new' },
    ]);
    expect(flows.createExpense).toHaveBeenCalledWith(
      'svc-1',
      expect.objectContaining({ sourceInvoiceId: 'inv-1' }),
    );
  });

  it('reuses the sourceInvoiceId expense instead of creating a second one', async () => {
    prisma.clientServiceRecord.findMany.mockResolvedValue([eligibleService()]);
    prisma.expense.findMany.mockResolvedValue([
      {
        id: 'exp-existing',
        sourceInvoiceId: 'inv-1',
        dueDate: RENEWAL,
        status: 'DUE_NOW',
        notes: null,
      },
    ]);

    const result = await runClientServicesRenewalExpenses(
      prisma as never,
      flows as never as ClientServiceFlowsService,
      { asOf: AS_OF.toISOString() },
    );

    expect(result.created).toEqual([]);
    expect(result.skippedExisting).toBe(1);
    expect(flows.createExpense).not.toHaveBeenCalled();
  });

  it('does not create a second expense after payment already linked one', async () => {
    prisma.clientServiceRecord.findMany.mockResolvedValue([
      eligibleService({
        invoices: [
          {
            id: 'inv-1',
            moneyStatus: 'PAID',
            createdAt: AS_OF,
            dueDate: RENEWAL,
            amount: new Decimal(40),
          },
        ],
      }),
    ]);
    prisma.expense.findMany.mockResolvedValue([
      {
        id: 'exp-paid',
        sourceInvoiceId: 'inv-1',
        dueDate: RENEWAL,
        status: 'PAID',
        notes: null,
      },
    ]);

    const result = await runClientServicesRenewalExpenses(
      prisma as never,
      flows as never as ClientServiceFlowsService,
      { asOf: AS_OF.toISOString() },
    );

    expect(result.skippedExisting).toBe(1);
    expect(flows.createExpense).not.toHaveBeenCalled();
  });
});

function eligibleService(
  overrides: {
    invoices?: Array<{
      id: string;
      moneyStatus: string;
      createdAt: Date;
      dueDate: Date | null;
      amount: unknown;
    }>;
  } = {},
) {
  return {
    id: 'svc-1',
    name: 'example.am',
    ourCost: new Decimal(40),
    renewalDate: RENEWAL,
    invoices: overrides.invoices ?? [
      {
        id: 'inv-1',
        moneyStatus: 'AWAITING_PAYMENT',
        createdAt: AS_OF,
        dueDate: RENEWAL,
        amount: new Decimal(40),
      },
    ],
  };
}
