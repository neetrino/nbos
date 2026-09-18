'use client';

import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { DataView, ListMutationErrorBanner } from '@/components/shared';
import { useIsMobileViewport } from '@/hooks/use-is-mobile-viewport';
import type { ExpensePlanGridPayload } from '@/lib/api/expense-plans';
import { ExpensePlanCoverageDesktopGrid } from './ExpensePlanCoverageDesktopGrid';
import { ExpensePlanCoverageMobileBoard } from './ExpensePlanCoverageMobileBoard';
import { useExpensePlansT } from './expense-plan-message-keys';

interface ExpensePlanCoverageGridProps {
  year: number;
  onYearChange: (year: number) => void;
  payload: ExpensePlanGridPayload | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onDismissError: () => void;
  onOpenPlan: (planId: string) => void;
  onOpenExpense: (expenseId: string) => void;
}

export function ExpensePlanCoverageGrid({
  year,
  onYearChange,
  payload,
  loading,
  error,
  onRetry,
  onDismissError,
  onOpenPlan,
  onOpenExpense,
}: ExpensePlanCoverageGridProps) {
  const t = useExpensePlansT();
  const tCommon = useTranslations('common');
  const isMobileViewport = useIsMobileViewport();
  const hasGrid = payload != null && payload.rows.length > 0;

  return (
    <DataView
      loading={loading}
      error={error}
      hasData={hasGrid}
      loadingFallback={
        <div className="border-border bg-muted/30 h-40 animate-pulse rounded-xl border" />
      }
      errorFallback={
        <div className="border-border bg-destructive/10 flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm">
          <span>{error}</span>
          <Button type="button" variant="outline" size="sm" onClick={() => void onRetry()}>
            {tCommon('tryAgain')}
          </Button>
        </div>
      }
      emptyFallback={<p className="text-muted-foreground text-sm">{t('grid.empty')}</p>}
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        {error ? <ListMutationErrorBanner message={error} onDismiss={onDismissError} /> : null}
        {isMobileViewport && payload ? (
          <ExpensePlanCoverageMobileBoard
            year={year}
            onYearChange={onYearChange}
            payload={payload}
            onOpenPlan={onOpenPlan}
            onOpenExpense={onOpenExpense}
          />
        ) : payload ? (
          <ExpensePlanCoverageDesktopGrid
            year={year}
            onYearChange={onYearChange}
            payload={payload}
            onOpenPlan={onOpenPlan}
            onOpenExpense={onOpenExpense}
          />
        ) : null}
      </div>
    </DataView>
  );
}
