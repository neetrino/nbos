import {
  sumNetEncodedBonusCashByRelease,
  type PayrollCashPaymentNotes,
} from './payroll-salary-first-cash-reverse';
import {
  alreadySettledSalaryRows,
  includedUnpaidReleaseRows,
  leftoverSalaryCapCarryRows,
  unappliedRefundResidualRows,
  unpaidBonusRows,
} from './payroll-cutover-unpaid-inventory-rows';
import type {
  CutoverUnpaidInventory,
  CutoverUnpaidInventoryDb,
  CutoverUnpaidSnapshots,
} from './payroll-cutover-unpaid-inventory.types';

const BONUS_ENTRY_SELECT = {
  id: true,
  employeeId: true,
  amount: true,
  earnedPeriod: true,
  status: true,
} as const;

const BONUS_RELEASE_SELECT = {
  id: true,
  bonusEntryId: true,
  employeeId: true,
  amount: true,
  payrollIncludedAmount: true,
  kpiBurnedAmount: true,
  status: true,
  payrollRunId: true,
  payrollCarryOverAmount: true,
  payrollCarryOverRemaining: true,
  payrollRun: { select: { id: true, status: true, payrollMonth: true } },
} as const;

const SALARY_LINE_SELECT = {
  id: true,
  employeeId: true,
  expenseId: true,
  paidAmount: true,
  remainingAmount: true,
  status: true,
  payrollRun: { select: { id: true, status: true } },
} as const;

const PAYMENT_SELECT = {
  id: true,
  expenseId: true,
  amount: true,
  notes: true,
} as const;

/**
 * Read-only inventory of old unpaid payroll balances for Finance review.
 * Does not choose a cutover month and does not create, update, delete, or upsert money rows.
 */
export async function loadCutoverUnpaidInventory(
  db: CutoverUnpaidInventoryDb,
): Promise<CutoverUnpaidInventory> {
  const snapshots = await loadCutoverUnpaidSnapshots(db);
  return buildCutoverUnpaidInventory(snapshots);
}

export function buildCutoverUnpaidInventory(
  snapshots: CutoverUnpaidSnapshots,
): CutoverUnpaidInventory {
  const attributed = sumNetEncodedBonusCashByRelease(paymentNotes(snapshots));
  return {
    unpaidBonuses: unpaidBonusRows(snapshots.entries, snapshots.releases, attributed),
    includedUnpaidReleases: includedUnpaidReleaseRows(snapshots.releases, attributed),
    leftoverSalaryCapCarry: leftoverSalaryCapCarryRows(snapshots.releases),
    unappliedRefundResiduals: unappliedRefundResidualRows(
      snapshots.payments,
      snapshots.salaryLines,
    ),
    alreadySettled: alreadySettledSalaryRows(snapshots.salaryLines),
  };
}

async function loadCutoverUnpaidSnapshots(
  db: CutoverUnpaidInventoryDb,
): Promise<CutoverUnpaidSnapshots> {
  const [entries, releases, salaryLines, payments] = await Promise.all([
    db.bonusEntry.findMany({ select: BONUS_ENTRY_SELECT }),
    db.bonusRelease.findMany({ select: BONUS_RELEASE_SELECT }),
    db.salaryLine.findMany({ select: SALARY_LINE_SELECT }),
    db.expensePayment.findMany({ select: PAYMENT_SELECT }),
  ]);
  return { entries, releases, salaryLines, payments };
}

function paymentNotes(snapshots: CutoverUnpaidSnapshots): PayrollCashPaymentNotes[] {
  return snapshots.payments.map((payment) => ({
    id: payment.id,
    amount: payment.amount,
    notes: payment.notes,
  }));
}
