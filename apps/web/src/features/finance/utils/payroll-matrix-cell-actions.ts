import type { PayrollAllocationMatrixCell } from '@/lib/api/payroll-allocation-matrix';

/**
 * A cell offers a "create manual bonus" affordance when the run is editable and
 * the employee has either no link to the order, or a link without a bonus entry
 * yet. Shared by the allocation matrix and the employee bonus history views so
 * both expose the same manual-bonus behaviour.
 */
export function matrixCellNeedsManualBonus(
  cell: PayrollAllocationMatrixCell,
  editable: boolean,
): boolean {
  return (
    editable &&
    (cell.state === 'UNLINKED' ||
      (cell.state === 'LINKED_EMPTY' && !cell.bonusEntryId && cell.linked))
  );
}
