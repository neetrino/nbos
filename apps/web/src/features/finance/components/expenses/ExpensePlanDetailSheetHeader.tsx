'use client';

import { Ban, CalendarDays, RotateCcw, Trash2 } from 'lucide-react';
import { DetailSheetSettingsMenu, StatusBadge } from '@/components/shared';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { getExpensePlanStatus } from '@/features/finance/constants/expense-plan-status';
import { formatAmount } from '@/features/finance/constants/finance';
import { getExpenseCategoryLabel } from '@/features/finance/constants/expense-category-visual';
import { formatExpensePlanShortDate } from '@/features/finance/utils/expense-plan-display';
import {
  translateExpensePlanCategory,
  translateExpensePlanFrequency,
  translateExpensePlanStatus,
  useExpensePlansT,
} from './expense-plan-message-keys';
import { useLocale } from 'next-intl';
import {
  expensePlanCanCancel,
  expensePlanCanResume,
} from '@/features/finance/utils/expense-plan-status-eligibility';
import type { ExpensePlan } from '@/lib/api/expense-plans';
import { parseMoneyAmount } from '@/lib/format/money';
import { expenseOwnerLabel } from '@/features/finance/utils/expense-owner-label';

interface ExpensePlanDetailSheetHeaderProps {
  plan: ExpensePlan;
  displayName: string;
  actionsDisabled?: boolean;
  onCancelClick: () => void;
  onResumeClick: () => void;
  onDeleteClick: () => void;
}

function buildExpensePlanHeaderSubline(
  plan: ExpensePlan,
  frequencyLabel: string,
  dueLabel: string | null,
): string {
  const parts = [
    formatAmount(parseMoneyAmount(plan.amount)),
    frequencyLabel,
    dueLabel,
    expenseOwnerLabel(plan),
  ].filter(Boolean);
  return parts.join(' · ');
}

export function ExpensePlanDetailSheetHeader({
  plan,
  displayName,
  actionsDisabled = false,
  onCancelClick,
  onResumeClick,
  onDeleteClick,
}: ExpensePlanDetailSheetHeaderProps) {
  const t = useExpensePlansT();
  const locale = useLocale();
  const categoryLabel = translateExpensePlanCategory(
    t,
    plan.category,
    getExpenseCategoryLabel(plan.category),
  );
  const dueLabel = plan.nextDueDate
    ? t('sheet.dueOn', { date: formatExpensePlanShortDate(plan.nextDueDate, locale) })
    : null;
  const subline = buildExpensePlanHeaderSubline(
    plan,
    translateExpensePlanFrequency(t, plan.frequency),
    dueLabel,
  );
  const statusMeta = getExpensePlanStatus(plan.status);

  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="inline-flex max-w-full min-w-0 flex-wrap items-center gap-2">
          <CalendarDays className="text-muted-foreground size-5 shrink-0" aria-hidden />
          <div className="min-w-0">
            <h2 className="text-foreground truncate text-xl font-bold tracking-tight">
              {displayName}
            </h2>
          </div>
          <span className="text-muted-foreground rounded-md border px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
            {categoryLabel}
          </span>
          {statusMeta ? (
            <StatusBadge
              label={translateExpensePlanStatus(t, plan.status, statusMeta.label)}
              variant={statusMeta.variant}
              className="rounded-full px-2.5 text-[10px] font-semibold tracking-wide"
            />
          ) : null}
        </div>
        {subline ? <p className="text-muted-foreground mt-0.5 text-sm">{subline}</p> : null}
      </div>
      <DetailSheetSettingsMenu>
        {expensePlanCanCancel(plan) ? (
          <DropdownMenuItem disabled={actionsDisabled} onClick={onCancelClick}>
            <Ban />
            {t('sheet.stopPlan')}
          </DropdownMenuItem>
        ) : null}
        {expensePlanCanResume(plan) ? (
          <DropdownMenuItem disabled={actionsDisabled} onClick={onResumeClick}>
            <RotateCcw />
            {t('sheet.resumePlan')}
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem variant="destructive" disabled={actionsDisabled} onClick={onDeleteClick}>
          <Trash2 />
          {t('sheet.deletePlan')}
        </DropdownMenuItem>
      </DetailSheetSettingsMenu>
    </div>
  );
}
