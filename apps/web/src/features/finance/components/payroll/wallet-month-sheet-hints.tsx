'use client';

import { COMPENSATION_PAYOUT_PHASE_UI } from '@/features/finance/constants/compensation-payout-phase-ui';
import type { SalaryLineMonthDetail } from '@/lib/api/payroll-runs';

function parseAmount(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

/** Read-only copy for wallet month detail sheet (NBOS Employee Wallet). */
export function WalletMonthSheetHints({ detail }: { detail: SalaryLineMonthDetail }) {
  const phaseUi = COMPENSATION_PAYOUT_PHASE_UI[detail.payoutPhase];
  const paid = parseAmount(detail.salaryLine.paidAmount);
  const remaining = parseAmount(detail.salaryLine.remainingAmount);
  const partial = paid > 0 && remaining > 0;

  return (
    <div className="border-border bg-muted/20 rounded-lg border px-3 py-2.5 text-xs">
      <p className="text-foreground font-medium">Payout phase: {phaseUi.label}</p>
      <p className="text-muted-foreground mt-1 leading-snug">{phaseUi.description}</p>
      {partial ? (
        <p className="text-muted-foreground mt-2 leading-snug">
          Partial pay this month — {phaseUi.label} does not mean the full amount is in your bank
          yet; see payments below when an expense card exists.
        </p>
      ) : null}
      {detail.bonusBreakdown.some((row) => row.type === 'SALES') ? (
        <p className="text-muted-foreground mt-2 leading-snug">
          Sales bonuses may be reduced at payroll attach when KPI is below target (burned amount
          detail will appear here after policy engine ships).
        </p>
      ) : null}
    </div>
  );
}
