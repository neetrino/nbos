import { describe, expect, it, vi } from 'vitest';
import { Decimal } from '@nbos/database';
import { NotFoundException } from '@nestjs/common';
import { createExpensePaymentRecord } from './expense-payment-create';
import {
  MARK_PAID_AUTO_EXPENSE_PAYMENT_NOTE,
  expenseMarkPaidOutstanding,
  markPaidExpensePaymentDateIso,
  settleExpenseMarkPaidIfOutstanding,
} from './expense-mark-paid-settle';

vi.mock('./expense-payment-create', () => ({
  createExpensePaymentRecord: vi.fn(),
}));

describe('expense-mark-paid-settle', () => {
  it('exposes an audit note for Mark Paid auto payments', () => {
    expect(MARK_PAID_AUTO_EXPENSE_PAYMENT_NOTE).toContain('marked as paid');
  });

  it('formats payment date as YYYY-MM-DD UTC calendar day', () => {
    expect(markPaidExpensePaymentDateIso(new Date('2026-07-17T18:04:00.000Z'))).toBe('2026-07-17');
  });

  it('returns remaining when the ledger is not fully paid', () => {
    expect(
      expenseMarkPaidOutstanding(new Decimal(100), [{ amount: new Decimal(40) }]).toNumber(),
    ).toBe(60);
  });

  it('returns zero when payments already cover the expense', () => {
    expect(
      expenseMarkPaidOutstanding(new Decimal(100), [{ amount: new Decimal(100) }]).toNumber(),
    ).toBe(0);
  });

  it('writes remaining as an Add Payment when Mark Paid is requested', async () => {
    vi.mocked(createExpensePaymentRecord).mockResolvedValue('pay-1');
    const prisma = {
      expense: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'e1',
          amount: new Decimal(100),
          expensePayments: [{ amount: new Decimal(40) }],
        }),
      },
    };

    const settled = await settleExpenseMarkPaidIfOutstanding(prisma as never, 'e1', {
      now: new Date('2026-09-04T10:00:00.000Z'),
    });

    expect(settled).toBe(true);
    expect(createExpensePaymentRecord).toHaveBeenCalledWith(
      prisma,
      'e1',
      {
        amount: 60,
        paymentDate: '2026-09-04',
        notes: MARK_PAID_AUTO_EXPENSE_PAYMENT_NOTE,
      },
      { notify: undefined, journal: undefined },
    );
  });

  it('skips a payment when the ledger is already covered', async () => {
    vi.mocked(createExpensePaymentRecord).mockClear();
    const prisma = {
      expense: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'e1',
          amount: new Decimal(100),
          expensePayments: [{ amount: new Decimal(100) }],
        }),
      },
    };

    const settled = await settleExpenseMarkPaidIfOutstanding(prisma as never, 'e1');

    expect(settled).toBe(false);
    expect(createExpensePaymentRecord).not.toHaveBeenCalled();
  });

  it('throws when the expense is missing', async () => {
    const prisma = {
      expense: { findUnique: vi.fn().mockResolvedValue(null) },
    };

    await expect(
      settleExpenseMarkPaidIfOutstanding(prisma as never, 'missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
