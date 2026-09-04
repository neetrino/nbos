'use client';

import { CalendarDays, Trash2 } from 'lucide-react';
import { DetailSheetSettingsMenu } from '@/components/shared';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { formatAmount } from '@/features/finance/constants/finance';
import { getExpenseCategoryLabel } from '@/features/finance/constants/expense-category-visual';
import {
  expensePlanFrequencyLabel,
  formatExpensePlanShortDate,
} from '@/features/finance/utils/expense-plan-display';
import type { ExpensePlan } from '@/lib/api/expense-plans';
import { parseMoneyAmount } from '@/lib/format/money';
import { projectDisplayName } from '@/lib/format/project-product-display';

interface ExpensePlanDetailSheetHeaderProps {
  plan: ExpensePlan;
  displayName: string;
  deleteDisabled?: boolean;
  onDeleteClick: () => void;
}

function buildExpensePlanHeaderSubline(plan: ExpensePlan): string {
  const parts = [
    formatAmount(parseMoneyAmount(plan.amount)),
    expensePlanFrequencyLabel(plan.frequency),
    plan.nextDueDate ? `Due ${formatExpensePlanShortDate(plan.nextDueDate)}` : null,
    projectDisplayName(plan.project),
  ].filter(Boolean);
  return parts.join(' · ');
}

export function ExpensePlanDetailSheetHeader({
  plan,
  displayName,
  deleteDisabled = false,
  onDeleteClick,
}: ExpensePlanDetailSheetHeaderProps) {
  const categoryLabel = getExpenseCategoryLabel(plan.category);
  const subline = buildExpensePlanHeaderSubline(plan);

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
        </div>
        {subline ? <p className="text-muted-foreground mt-0.5 text-sm">{subline}</p> : null}
      </div>
      <DetailSheetSettingsMenu>
        <DropdownMenuItem variant="destructive" disabled={deleteDisabled} onClick={onDeleteClick}>
          <Trash2 />
          Delete plan
        </DropdownMenuItem>
      </DetailSheetSettingsMenu>
    </div>
  );
}
