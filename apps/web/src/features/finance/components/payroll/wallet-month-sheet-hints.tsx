'use client';

import { useTranslations } from 'next-intl';
import {
  translateCompensationPayoutPhaseDescription,
  translateCompensationPayoutPhaseLabel,
} from '@/features/finance/components/payroll/payroll-compensation-i18n';
import type { SalaryLineMonthDetail } from '@/lib/api/payroll-runs';

function parseAmount(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

/** Read-only copy for wallet month detail sheet (NBOS Employee Wallet). */
export function WalletMonthSheetHints({ detail }: { detail: SalaryLineMonthDetail }) {
  const t = useTranslations('payroll');
  const phaseLabel = translateCompensationPayoutPhaseLabel(detail.payoutPhase, t);
  const paid = parseAmount(detail.salaryLine.paidAmount);
  const remaining = parseAmount(detail.salaryLine.remainingAmount);
  const partial = paid > 0 && remaining > 0;

  return (
    <div className="border-border bg-muted/20 rounded-lg border px-3 py-2.5 text-xs">
      <p className="text-foreground font-medium">
        {t('compensation.walletHints.payoutPhase', { phase: phaseLabel })}
      </p>
      <p className="text-muted-foreground mt-1 leading-snug">
        {translateCompensationPayoutPhaseDescription(detail.payoutPhase, t)}
      </p>
      {partial ? (
        <p className="text-muted-foreground mt-2 leading-snug">
          {t('compensation.walletHints.partialPay', { phase: phaseLabel })}
        </p>
      ) : null}
      {detail.bonusBreakdown.some((row) => row.type === 'SALES') ? (
        <p className="text-muted-foreground mt-2 leading-snug">
          {t('compensation.walletHints.salesBonusReduction')}
        </p>
      ) : null}
    </div>
  );
}
