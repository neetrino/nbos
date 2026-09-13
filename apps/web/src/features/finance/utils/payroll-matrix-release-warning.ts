import type { PayrollAllocationMatrixCell } from '@/lib/api/payroll-allocation-matrix';

export type MatrixReleaseWarningKind = 'EXTRA' | 'OVER_FUNDING';

export const MATRIX_RELEASE_WARNING_MESSAGE_KEY = {
  EXTRA: 'matrix.cell.warning.EXTRA',
  OVER_FUNDING: 'matrix.cell.warning.OVER_FUNDING',
} as const;

export type MatrixReleaseWarningMessageKey =
  (typeof MATRIX_RELEASE_WARNING_MESSAGE_KEY)[MatrixReleaseWarningKind];

export const MATRIX_CELL_STATE_MESSAGE_KEY = {
  READY: 'matrix.cell.state.READY',
  PARTIALLY_FUNDED: 'matrix.cell.state.PARTIALLY_FUNDED',
  PROGRESS: 'matrix.cell.state.PROGRESS',
  MANUAL_BONUS: 'matrix.cell.state.MANUAL_BONUS',
} as const;

export type MatrixCellStateMessageKey =
  (typeof MATRIX_CELL_STATE_MESSAGE_KEY)[keyof typeof MATRIX_CELL_STATE_MESSAGE_KEY];

/** Informational label for matrix cell edits — never blocks save. */
export function resolveMatrixReleaseWarningKind(
  amount: number,
  remaining: number,
  availableFunding: number,
): MatrixReleaseWarningKind | null {
  if (amount <= 0) {
    return null;
  }
  if (amount > remaining) {
    return 'EXTRA';
  }
  if (availableFunding > 0 && amount > availableFunding) {
    return 'OVER_FUNDING';
  }
  return null;
}

export function matrixReleaseWarningMessageKey(
  kind: MatrixReleaseWarningKind | null,
): MatrixReleaseWarningMessageKey | null {
  if (kind == null) {
    return null;
  }
  return MATRIX_RELEASE_WARNING_MESSAGE_KEY[kind];
}

export function matrixReleaseWarningForAmount(
  amount: number,
  remaining: number,
  availableFunding: number,
): MatrixReleaseWarningMessageKey | null {
  return matrixReleaseWarningMessageKey(
    resolveMatrixReleaseWarningKind(amount, remaining, availableFunding),
  );
}

function persistedWarningKind(cell: PayrollAllocationMatrixCell): MatrixReleaseWarningKind | null {
  if (cell.state === 'EXTRA_BONUS' || cell.warning === 'EXTRA' || cell.warning === 'Extra bonus') {
    return 'EXTRA';
  }
  if (
    cell.state === 'OVER_FUNDING' ||
    cell.warning === 'OVER_FUNDING' ||
    cell.warning === 'Over funding'
  ) {
    return 'OVER_FUNDING';
  }
  return null;
}

export function payrollMatrixCellCaptionMessageKey(
  cell: PayrollAllocationMatrixCell,
): MatrixReleaseWarningMessageKey | MatrixCellStateMessageKey | null {
  const warningKey = matrixReleaseWarningMessageKey(persistedWarningKind(cell));
  if (warningKey) {
    return warningKey;
  }
  if (
    cell.state === 'READY' ||
    cell.state === 'PARTIALLY_FUNDED' ||
    cell.state === 'PROGRESS' ||
    cell.state === 'MANUAL_BONUS'
  ) {
    return MATRIX_CELL_STATE_MESSAGE_KEY[cell.state];
  }
  return null;
}
