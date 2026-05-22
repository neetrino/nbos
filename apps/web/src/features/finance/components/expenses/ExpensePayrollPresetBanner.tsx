'use client';

import { Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  EXPENSE_PAYROLL_SOURCE_FILTER_KEY,
  EXPENSE_PAYROLL_SOURCE_PAYROLL,
} from '@/features/finance/constants/expense-payroll-filter';

export function ExpensePayrollPresetBanner({
  active,
  onApplyPayrollFilter,
  onClearPayrollFilter,
}: {
  active: boolean;
  onApplyPayrollFilter: () => void;
  onClearPayrollFilter: () => void;
}) {
  return (
    <div className="border-border bg-muted/30 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3">
      <div className="flex min-w-0 items-start gap-2">
        <Banknote size={16} className="text-muted-foreground mt-0.5 shrink-0" aria-hidden />
        <div>
          <p className="text-foreground text-sm font-medium">Payroll salary expenses</p>
          <p className="text-muted-foreground text-xs leading-snug">
            Cards materialized from approved payroll runs. Record payments here — salary line status
            syncs from the expense ledger.
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        {active ? (
          <Button type="button" variant="outline" size="sm" onClick={onClearPayrollFilter}>
            Show all expenses
          </Button>
        ) : (
          <Button type="button" size="sm" onClick={onApplyPayrollFilter}>
            Payroll only
          </Button>
        )}
      </div>
    </div>
  );
}

export function isPayrollSourceFilterActive(filters: Record<string, string>): boolean {
  return filters[EXPENSE_PAYROLL_SOURCE_FILTER_KEY] === EXPENSE_PAYROLL_SOURCE_PAYROLL;
}
