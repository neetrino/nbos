import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { CLIENT_SERVICE_RENEWAL_EXPENSE_WINDOW_DAYS } from './client-service-payment-stage';
import type { ClientServiceFlowsService } from './client-service-flows.service';
import {
  buildWePayExpenseWhere,
  wePayCycleExpenseExists,
  runWePayRenewalExpenses,
} from './client-services-we-pay-expense';

const AS_OF = new Date('2026-06-15T12:00:00.000Z');
const RENEWAL = new Date('2026-07-01T00:00:00.000Z');

describe('buildWePayExpenseWhere', () => {
  it('targets We Pay services inside the D−30 window', () => {
    const where = buildWePayExpenseWhere(AS_OF);
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

describe('wePayCycleExpenseExists', () => {
  it('ignores a paid expense from the previous renewal day', () => {
    expect(
      wePayCycleExpenseExists(
        [{ status: 'PAID', dueDate: new Date('2025-07-01T00:00:00.000Z') }],
        RENEWAL,
      ),
    ).toBe(false);
  });

  it('blocks a second expense when one is already open', () => {
    expect(wePayCycleExpenseExists([{ status: 'DUE_NOW', dueDate: RENEWAL }], RENEWAL)).toBe(true);
  });
});

describe('runWePayRenewalExpenses', () => {
  let prisma: MockPrisma;
  let flows: { createExpense: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    prisma = createMockPrisma();
    flows = { createExpense: vi.fn().mockResolvedValue({ id: 'exp-new' }) };
    prisma.expense.findMany.mockResolvedValue([]);
  });

  it('creates an expense without an invoice', async () => {
    prisma.clientServiceRecord.findMany.mockResolvedValue([
      { id: 'svc-1', name: 'neetrino.com', ourCost: 12, renewalDate: RENEWAL },
    ]);

    const result = await runWePayRenewalExpenses(
      prisma as never,
      flows as never as ClientServiceFlowsService,
      { asOf: AS_OF.toISOString() },
    );

    expect(result.created).toEqual([{ serviceId: 'svc-1', invoiceId: null, expenseId: 'exp-new' }]);
    expect(flows.createExpense).toHaveBeenCalledWith(
      'svc-1',
      expect.objectContaining({ amount: 12, status: 'DUE_NOW', dueDate: RENEWAL.toISOString() }),
    );
  });

  it('does not create a second expense for the same cycle', async () => {
    prisma.clientServiceRecord.findMany.mockResolvedValue([
      { id: 'svc-1', name: 'neetrino.com', ourCost: 12, renewalDate: RENEWAL },
    ]);
    prisma.expense.findMany.mockResolvedValue([{ status: 'DUE_NOW', dueDate: RENEWAL }]);

    const result = await runWePayRenewalExpenses(
      prisma as never,
      flows as never as ClientServiceFlowsService,
      { asOf: AS_OF.toISOString() },
    );

    expect(result.created).toEqual([]);
    expect(result.skippedExisting).toBe(1);
    expect(flows.createExpense).not.toHaveBeenCalled();
  });
});
