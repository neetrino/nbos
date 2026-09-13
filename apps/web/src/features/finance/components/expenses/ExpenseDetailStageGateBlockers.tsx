'use client';

import { useTranslations } from 'next-intl';
import type { ApiFieldError } from '@/lib/api-errors';
import { EXPENSE_PAID_LOCKED_GATE_MESSAGE } from '@/features/finance/constants/expense-status-gate-client';
import type { ExpenseDetailStageGateHighlight } from '@/features/finance/constants/expense-stage-gate-highlight';

export function ExpenseDetailStageGateBlockers({
  highlight,
}: {
  highlight: ExpenseDetailStageGateHighlight | null;
}) {
  const t = useTranslations('expenses');
  if (!highlight?.errors.length) return null;

  return (
    <div className="border-destructive/30 bg-destructive/5 space-y-1 rounded-xl border p-3">
      <p className="text-destructive text-xs font-semibold">{t('gate.completeBefore')}</p>
      <ul className="text-muted-foreground space-y-1 text-xs">
        {highlight.errors.map((error: ApiFieldError) => (
          <li key={`${error.field}-${error.message}`}>
            {error.message === EXPENSE_PAID_LOCKED_GATE_MESSAGE
              ? t('gate.paidLocked')
              : error.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
