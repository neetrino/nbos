import { describe, expect, it } from 'vitest';
import { filterPayrollAllocationMatrix } from './filter-payroll-allocation-matrix';
import type { PayrollAllocationMatrix } from '@/lib/api/payroll-allocation-matrix';

const baseMatrix: PayrollAllocationMatrix = {
  payrollRunId: 'run-1',
  payrollMonth: '2026-05',
  status: 'DRAFT',
  editable: true,
  employees: [
    {
      employeeId: 'e1',
      firstName: 'Anna',
      lastName: 'Alpha',
      position: null,
      baseSalary: '100',
      salaryLineId: null,
      bonusTotalThisRun: '0',
      payableTotal: '100',
    },
    {
      employeeId: 'e2',
      firstName: 'Bob',
      lastName: 'Beta',
      position: null,
      baseSalary: '100',
      salaryLineId: null,
      bonusTotalThisRun: '0',
      payableTotal: '100',
    },
  ],
  deliveryUnits: [
    {
      orderId: 'o1',
      orderCode: 'ORD-1',
      orderType: 'PRODUCT',
      projectId: 'p1',
      projectCode: 'PRJ-BLOG',
      label: 'Blog module',
      productId: null,
      extensionId: null,
      deliveryOpen: true,
      totalPlannedBonus: '0',
      totalReleasedBonus: '0',
      totalPaidBonus: '0',
      totalRemainingBonus: '0',
      availableFunding: '0',
      overFundingAmount: '0',
      inclusionReason: 'test',
    },
  ],
  cells: [
    {
      employeeId: 'e1',
      orderId: 'o1',
      state: 'LINKED_EMPTY',
      linked: true,
      bonusTitle: null,
      bonusEntryId: null,
      bonusReleaseId: null,
      plannedAmount: '0',
      originalAmount: null,
      currentAmount: '0',
      releasedBefore: '0',
      paidBefore: '0',
      remaining: '0',
      suggestedThisMonth: '0',
      releaseThisMonth: '0',
      warning: null,
      reasonRequired: false,
      editable: true,
    },
    {
      employeeId: 'e2',
      orderId: 'o1',
      state: 'LINKED_EMPTY',
      linked: true,
      bonusTitle: null,
      bonusEntryId: null,
      bonusReleaseId: null,
      plannedAmount: '0',
      originalAmount: null,
      currentAmount: '0',
      releasedBefore: '0',
      paidBefore: '0',
      remaining: '0',
      suggestedThisMonth: '0',
      releaseThisMonth: '0',
      warning: null,
      reasonRequired: false,
      editable: true,
    },
  ],
  layout: {
    viewMode: 'EMPLOYEE_MATRIX',
    rowOrder: ['e1', 'e2'],
    columnOrder: ['o1'],
    pinnedUnitIds: [],
  },
  totals: {
    totalBaseSalary: '200',
    totalBonuses: '0',
    totalPayable: '200',
    totalPaid: '0',
    totalRemaining: '200',
  },
};

describe('filterPayrollAllocationMatrix', () => {
  it('returns full matrix when search is empty', () => {
    expect(filterPayrollAllocationMatrix(baseMatrix, '')).toEqual(baseMatrix);
  });

  it('keeps coworkers on the same order when filtering by employee', () => {
    const filtered = filterPayrollAllocationMatrix(baseMatrix, 'Anna');
    expect(filtered.employees.map((e) => e.employeeId).sort()).toEqual(['e1', 'e2']);
    expect(filtered.deliveryUnits.map((u) => u.orderId)).toEqual(['o1']);
  });

  it('keeps linked employees when filtering by project code', () => {
    const filtered = filterPayrollAllocationMatrix(baseMatrix, 'PRJ-BLOG');
    expect(filtered.employees).toHaveLength(2);
    expect(filtered.deliveryUnits).toHaveLength(1);
  });
});
