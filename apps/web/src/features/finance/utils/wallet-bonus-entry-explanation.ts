import type { EmployeeWalletBonusRow } from '@/lib/api/me';

function parseAmount(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Short plain-language line for one wallet bonus card (from existing snapshot fields).
 */
export function walletBonusEntryExplanation(row: EmployeeWalletBonusRow): string | null {
  if (row.status === 'CLAWBACK') {
    return 'Clawback — this bonus was reversed or reduced. Check Corrections or ask Finance.';
  }

  const planned = parseAmount(row.amount);
  const paid = parseAmount(row.paidAmount);
  const released = parseAmount(row.releasedAmount);
  const remaining = parseAmount(row.remainingAmount);

  if (row.walletGroup === 'PAID' || row.status === 'PAID') {
    if (remaining > 0) {
      return 'Marked paid; a small remaining amount may reflect timing between release and entry totals.';
    }
    return 'Paid through payroll — releases on this entry are recorded as paid.';
  }

  if (row.status === 'PENDING_ELIGIBILITY') {
    return 'Waiting on eligibility (e.g. product delivered, KPI, or funding) before payroll release.';
  }

  if (row.status === 'INCOMING' || row.status === 'EARNED') {
    return 'Potential accrual — bonus grows with client payments or project progress, not paid yet.';
  }

  if (paid > 0 && remaining > 0) {
    return 'Partially paid — part went through payroll; the rest is still planned or awaiting release.';
  }

  if (released > 0 && paid === 0 && row.payrollMonth) {
    return `Included in payroll ${row.payrollMonth} — payout when Finance records expense payments.`;
  }

  if (released > 0 && paid === 0) {
    return 'Released to payroll but not paid yet — follows Pay Now / expense payment timing.';
  }

  const burned = row.kpiBurnedAmount ? parseAmount(row.kpiBurnedAmount) : 0;
  if (burned > 0) {
    return `Sales KPI reduced payroll by ${burned.toFixed(2)} on a prior attach — see included vs released amounts.`;
  }

  if (row.walletGroup === 'NEXT_PAYROLL' && planned > 0) {
    return 'Queued for payroll — amount may change if KPI or funding rules apply at attach.';
  }

  if (row.type === 'SALES' && row.salesAccrualHint) {
    return null;
  }

  if (row.type === 'SALES' && row.walletGroup === 'IN_PROGRESS') {
    return 'Sales bonus — payout may depend on KPI when the release is attached to payroll.';
  }

  return null;
}
