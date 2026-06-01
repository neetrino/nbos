import { Decimal } from '@nbos/database';
import { describe, expect, it, vi } from 'vitest';

import { assertSalesBonusReadyForPayrollAttach } from './resolve-sales-bonus-payable-at-attach';

const entryRow = {
  id: 'be1',
  title: 'Seller bonus',
  type: 'SALES',
  employeeId: 'e1',
  amount: new Decimal(100),
  earnedPeriod: '2026-04',
  payableAmount: new Decimal(70),
  kpiPayoutFactor: new Decimal('0.7'),
  employee: { firstName: 'Anna', lastName: 'Petrosyan' },
  order: { code: 'ORD-1' },
};

describe('assertSalesBonusReadyForPayrollAttach', () => {
  it('passes when payable snapshot exists for prior earned month', async () => {
    const db = {
      bonusEntry: {
        findUnique: vi.fn().mockResolvedValue(entryRow),
      },
    };

    await expect(
      assertSalesBonusReadyForPayrollAttach(db as never, {
        bonusEntryId: 'be1',
        payrollMonth: '2026-05',
      }),
    ).resolves.toBeUndefined();
  });

  it('throws when payable snapshot is missing', async () => {
    const db = {
      bonusEntry: {
        findUnique: vi.fn().mockResolvedValue({
          ...entryRow,
          payableAmount: null,
          kpiPayoutFactor: null,
        }),
      },
    };

    await expect(
      assertSalesBonusReadyForPayrollAttach(db as never, {
        bonusEntryId: 'be1',
        payrollMonth: '2026-05',
      }),
    ).rejects.toThrow(/not ready for payroll/);
  });

  it('throws when earned period does not match payroll month minus one', async () => {
    const db = {
      bonusEntry: {
        findUnique: vi.fn().mockResolvedValue({
          ...entryRow,
          earnedPeriod: '2026-03',
        }),
      },
    };

    await expect(
      assertSalesBonusReadyForPayrollAttach(db as never, {
        bonusEntryId: 'be1',
        payrollMonth: '2026-05',
      }),
    ).rejects.toThrow(/not eligible for payroll month/);
  });
});
