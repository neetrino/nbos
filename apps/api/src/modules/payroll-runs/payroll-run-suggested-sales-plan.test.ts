import { describe, expect, it } from 'vitest';
import { Decimal } from '@nbos/database';

import { createMockPrisma } from '../../test-utils/mock-prisma';

import {
  previousPayrollMonth,
  resolvePriorPayrollRunSalesPlanAmount,
  resolveSuggestedSalesPlanByEmployee,
} from './payroll-run-suggested-sales-plan';

describe('previousPayrollMonth', () => {
  it('returns prior calendar month', () => {
    expect(previousPayrollMonth('2026-03')).toBe('2026-02');
    expect(previousPayrollMonth('2026-01')).toBe('2025-12');
  });

  it('returns null for invalid month', () => {
    expect(previousPayrollMonth('2026-13')).toBeNull();
  });
});

describe('resolveSuggestedSalesPlanByEmployee', () => {
  it('uses line override then run default from prior payroll month', async () => {
    const prisma = createMockPrisma();
    prisma.payrollRun.findUnique.mockResolvedValue({
      kpiSalesPlanAmount: new Decimal('1000'),
      salaryLines: [
        { employeeId: 'e1', kpiSalesPlanAmount: new Decimal('2000') },
        { employeeId: 'e2', kpiSalesPlanAmount: null },
      ],
    });

    const totals = await resolveSuggestedSalesPlanByEmployee(prisma as never, '2026-05', [
      'e1',
      'e2',
      'e3',
    ]);

    expect(prisma.payrollRun.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { payrollMonth: '2026-04' } }),
    );
    expect(totals.get('e1')?.toFixed(2)).toBe('2000.00');
    expect(totals.get('e2')?.toFixed(2)).toBe('1000.00');
    expect(totals.get('e3')?.toFixed(2)).toBe('1000.00');
  });

  it('returns zeros when prior run is missing', async () => {
    const prisma = createMockPrisma();
    prisma.payrollRun.findUnique.mockResolvedValue(null);

    const totals = await resolveSuggestedSalesPlanByEmployee(prisma as never, '2026-05', ['e1']);

    expect(totals.get('e1')?.toFixed(2)).toBe('0.00');
  });
});

describe('resolvePriorPayrollRunSalesPlanAmount', () => {
  it('returns prior run plan when positive', async () => {
    const prisma = createMockPrisma();
    prisma.payrollRun.findUnique.mockResolvedValue({
      kpiSalesPlanAmount: new Decimal('5000'),
    });

    const plan = await resolvePriorPayrollRunSalesPlanAmount(prisma as never, '2026-05');

    expect(plan?.toFixed(2)).toBe('5000.00');
  });
});
