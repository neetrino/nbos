import { getApiErrorMessage } from '@/lib/api-errors';
import type {
  PayrollAllocationMatrix,
  PayrollAllocationMatrixCell,
} from '@/lib/api/payroll-allocation-matrix';

const UUID = String.raw`[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}`;

/** Legacy API copy before human-readable Sales KPI attach errors. */
const LEGACY_SALES_SNAPSHOT_RE = new RegExp(
  `Sales bonus ${UUID} has no payable snapshot for earned period (.+)`,
  'i',
);

const LEGACY_BONUS_ENTRY_RE = new RegExp(`Bonus entry ${UUID}`, 'gi');

function sanitizePayrollMatrixApiMessage(message: string): string {
  const legacySnapshot = LEGACY_SALES_SNAPSHOT_RE.exec(message);
  if (legacySnapshot) {
    const period = legacySnapshot[1]?.trim() ?? '—';
    return (
      `Sales bonus has no KPI payout snapshot for earned month ${period}. ` +
      'Sync Sales KPI for that month, then retry.'
    );
  }

  return message.replace(LEGACY_BONUS_ENTRY_RE, 'Bonus entry');
}

function matrixCellContextLabel(
  cell: PayrollAllocationMatrixCell,
  matrix: PayrollAllocationMatrix,
): string | null {
  const employee = matrix.employees.find((row) => row.employeeId === cell.employeeId);
  const order = matrix.deliveryUnits.find((unit) => unit.orderId === cell.orderId);
  const employeeName = employee
    ? [employee.firstName, employee.lastName].filter(Boolean).join(' ').trim()
    : '';
  const orderLabel = order?.label?.trim() || order?.orderCode?.trim() || cell.bonusTitle?.trim();
  const parts = [employeeName, orderLabel].filter((part) => part && part.length > 0);
  return parts.length > 0 ? parts.join(' · ') : null;
}

/** User-facing toast copy for allocation matrix cell save failures. */
export function formatPayrollMatrixCellError(
  caught: unknown,
  fallback: string,
  context?: {
    cell: PayrollAllocationMatrixCell;
    matrix: PayrollAllocationMatrix | null;
  },
): string {
  const raw = getApiErrorMessage(caught, fallback);
  const message = sanitizePayrollMatrixApiMessage(raw);

  if (!context?.matrix) {
    return message;
  }

  const label = matrixCellContextLabel(context.cell, context.matrix);
  if (!label || message.includes(label)) {
    return message;
  }

  return `${label} — ${message}`;
}
