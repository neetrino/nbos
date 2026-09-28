import { BadRequestException } from '@nestjs/common';
import { Decimal } from '@nbos/database';
import { describe, expect, it, vi } from 'vitest';

import {
  canCreateTerminatedBonusSettlementLine,
  isZeroSalaryBonusSettlementLine,
  loadOrCreateBonusSettlementSalaryLine,
} from './payroll-bonus-settlement-salary-line';

describe('isZeroSalaryBonusSettlementLine', () => {
  it('accepts a 0.00 line with no profile and rejects ordinary or foreign-profile lines', () => {
    expect(
      isZeroSalaryBonusSettlementLine({
        baseSalary: new Decimal('0.00'),
        compensationProfileId: null,
        compensationProfile: null,
      }),
    ).toBe(true);
    expect(
      isZeroSalaryBonusSettlementLine({
        baseSalary: new Decimal('300000.00'),
        compensationProfileId: null,
        compensationProfile: null,
      }),
    ).toBe(false);
    expect(
      isZeroSalaryBonusSettlementLine({
        baseSalary: new Decimal('0.00'),
        compensationProfileId: 'cp-1',
        compensationProfile: { currency: 'USD' },
      }),
    ).toBe(false);
  });
});

describe('canCreateTerminatedBonusSettlementLine', () => {
  it('allows a zero-salary settlement line after the Asia/Yerevan fire month', () => {
    const fired = {
      status: 'TERMINATED',
      fireDate: new Date('2026-08-20T12:00:00.000Z'),
    };
    expect(canCreateTerminatedBonusSettlementLine(fired, '2026-08')).toBe(false);
    expect(canCreateTerminatedBonusSettlementLine(fired, '2026-10')).toBe(true);
  });

  it('does not create a settlement line for an active employee', () => {
    expect(
      canCreateTerminatedBonusSettlementLine({ status: 'ACTIVE', fireDate: null }, '2026-10'),
    ).toBe(false);
  });
});

describe('loadOrCreateBonusSettlementSalaryLine', () => {
  it('creates a 0.00 salary settlement line for a terminated employee after fire month', async () => {
    const created = {
      id: 'sl-settle',
      baseSalary: new Decimal(0),
      bonusesTotal: new Decimal(0),
      paidAmount: new Decimal(0),
    };
    const tx = {
      salaryLine: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(created),
      },
      employee: {
        findUnique: vi.fn().mockResolvedValue({
          status: 'TERMINATED',
          fireDate: new Date('2026-08-20T12:00:00.000Z'),
        }),
      },
    };

    const line = await loadOrCreateBonusSettlementSalaryLine(tx as never, {
      payrollRunId: 'pr-oct',
      employeeId: 'e-term',
      payrollMonth: '2026-10',
    });

    expect(line.baseSalary.toFixed(2)).toBe('0.00');
    const createArg = tx.salaryLine.create.mock.calls[0]?.[0] as {
      data: { employeeId: string; compensationProfileId: null; baseSalary: Decimal };
    };
    expect(createArg.data.employeeId).toBe('e-term');
    expect(createArg.data.compensationProfileId).toBeNull();
    expect(createArg.data.baseSalary.toFixed(2)).toBe('0.00');
  });

  it('does not invent a covering-profile salary when the fire-month line is missing', async () => {
    const tx = {
      salaryLine: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn(),
      },
      employee: {
        findUnique: vi.fn().mockResolvedValue({
          status: 'TERMINATED',
          fireDate: new Date('2026-08-20T12:00:00.000Z'),
        }),
      },
    };

    await expect(
      loadOrCreateBonusSettlementSalaryLine(tx as never, {
        payrollRunId: 'pr-aug',
        employeeId: 'e-term',
        payrollMonth: '2026-08',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.salaryLine.create).not.toHaveBeenCalled();
  });
});
