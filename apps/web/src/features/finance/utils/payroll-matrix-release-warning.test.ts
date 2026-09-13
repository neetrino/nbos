import { describe, expect, it } from 'vitest';
import {
  matrixReleaseWarningForAmount,
  payrollMatrixCellCaptionMessageKey,
  resolveMatrixReleaseWarningKind,
} from './payroll-matrix-release-warning';
import type { PayrollAllocationMatrixCell } from '@/lib/api/payroll-allocation-matrix';

const baseCell: PayrollAllocationMatrixCell = {
  employeeId: 'emp1',
  orderId: 'ord1',
  state: 'READY',
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

describe('payroll-matrix-release-warning', () => {
  it('warns extra when amount exceeds remaining', () => {
    expect(resolveMatrixReleaseWarningKind(100, 80, 500)).toBe('EXTRA');
    expect(matrixReleaseWarningForAmount(100, 80, 500)).toBe('matrix.cell.warning.EXTRA');
  });

  it('warns over funding when amount exceeds positive Avail within remaining', () => {
    expect(resolveMatrixReleaseWarningKind(50, 80, 40)).toBe('OVER_FUNDING');
    expect(matrixReleaseWarningForAmount(50, 80, 40)).toBe('matrix.cell.warning.OVER_FUNDING');
  });

  it('does not warn within remaining when Avail is zero', () => {
    expect(resolveMatrixReleaseWarningKind(2_333, 81_000, 0)).toBeNull();
    expect(matrixReleaseWarningForAmount(2_333, 81_000, 0)).toBeNull();
  });

  it('does not warn within remaining and Avail', () => {
    expect(matrixReleaseWarningForAmount(50, 80, 100)).toBeNull();
  });

  it('maps persisted cell warning and state to message keys', () => {
    expect(payrollMatrixCellCaptionMessageKey({ ...baseCell, state: 'READY' })).toBe(
      'matrix.cell.state.READY',
    );
    expect(
      payrollMatrixCellCaptionMessageKey({
        ...baseCell,
        state: 'EXTRA_BONUS',
        warning: 'Extra bonus',
      }),
    ).toBe('matrix.cell.warning.EXTRA');
    expect(
      payrollMatrixCellCaptionMessageKey({
        ...baseCell,
        state: 'OVER_FUNDING',
        warning: 'OVER_FUNDING',
      }),
    ).toBe('matrix.cell.warning.OVER_FUNDING');
  });
});
