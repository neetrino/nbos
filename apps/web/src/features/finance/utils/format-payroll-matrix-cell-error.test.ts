import { ApiError } from '@/lib/api-errors';
import type {
  PayrollAllocationMatrix,
  PayrollAllocationMatrixCell,
} from '@/lib/api/payroll-allocation-matrix';
import { describe, expect, it } from 'vitest';
import { formatPayrollMatrixCellError } from './format-payroll-matrix-cell-error';

const cell: PayrollAllocationMatrixCell = {
  employeeId: 'emp1',
  orderId: 'ord1',
  state: 'RELEASE_SET',
  linked: true,
  bonusTitle: 'Seller bonus',
  bonusEntryId: 'be1',
  bonusReleaseId: 'br1',
  plannedAmount: '100',
  originalAmount: '100',
  currentAmount: '100',
  releasedBefore: '0',
  paidBefore: '0',
  remaining: '100',
  suggestedThisMonth: '100',
  releaseThisMonth: '50',
  warning: null,
  reasonRequired: false,
  editable: true,
};

const matrix = {
  employees: [
    {
      employeeId: 'emp1',
      firstName: 'Anna',
      lastName: 'Petrosyan',
      position: null,
      baseSalary: '500000',
      salaryLineId: 'sl1',
      bonusTotalThisRun: '0',
      payableTotal: '500000',
    },
  ],
  deliveryUnits: [
    {
      orderId: 'ord1',
      orderCode: 'ORD-42',
      orderType: 'PRODUCT' as const,
      projectId: 'p1',
      projectCode: 'PRJ-1',
      label: 'Website redesign',
      productId: null,
      extensionId: null,
      deliveryOpen: true,
      totalPlannedBonus: '100',
      totalReleasedBonus: '0',
      totalPaidBonus: '0',
      totalRemainingBonus: '100',
      availableFunding: '100',
      overFundingAmount: '0',
      inclusionReason: 'DELIVERY',
    },
  ],
} as Pick<PayrollAllocationMatrix, 'employees' | 'deliveryUnits'>;

describe('formatPayrollMatrixCellError', () => {
  it('rewrites legacy Sales bonus UUID snapshot errors', () => {
    const caught = new ApiError(
      'Sales bonus c5b7af1c-b8a6-4736-9e66-12b3abfcc5ec has no payable snapshot for earned period 2026-05',
    );

    expect(formatPayrollMatrixCellError(caught, 'Could not update release.')).toBe(
      'Sales bonus is not ready for payroll (earned month 2026-05). Sync Sales KPI for that month, then retry.',
    );
  });

  it('prefixes matrix row context when available', () => {
    const caught = new ApiError(
      'Sales bonus has no KPI payout snapshot for earned period 2026-05. Run Sales KPI repair for that month, then retry.',
    );

    expect(
      formatPayrollMatrixCellError(caught, 'Could not update release.', {
        cell,
        matrix: matrix as PayrollAllocationMatrix,
      }),
    ).toBe(
      'Anna Petrosyan · Website redesign — Sales bonus has no KPI payout snapshot for earned period 2026-05. Run Sales KPI repair for that month, then retry.',
    );
  });
});
