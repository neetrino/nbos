'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { expensePlansListWithOpenPlanHref } from '@/features/finance/constants/expense-plan-deep-link';
import type { ExpensePlan } from '@/lib/api/expense-plans';
import { marketingAccountUsesPhone } from '@/features/marketing/constants/marketing-settings-surface';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const NO_PLAN_VALUE = '__marketing_no_expense_plan__';

function planLabel(plan: ExpensePlan): string {
  return `${plan.name} · ${plan.amount} ${plan.frequency}`;
}

function resolveExpensePlanSelectLabel(params: {
  trimmedId: string;
  linkedMissingFromList: boolean;
  selectedPlan: ExpensePlan | undefined;
  noPlanLabel: string;
  missingLabel: string;
  chooseLabel: string;
}): string {
  if (!params.trimmedId) return params.noPlanLabel;
  if (params.linkedMissingFromList) return params.missingLabel;
  if (params.selectedPlan) return planLabel(params.selectedPlan);
  return params.chooseLabel;
}

interface MarketingAccountExpensePlanLinkProps {
  channel: string;
  expensePlans: ExpensePlan[];
  selectedPlanId: string;
  onSelectedPlanIdChange: (planId: string) => void;
  plansLoading: boolean;
  disabled?: boolean;
}

export function MarketingAccountExpensePlanLink({
  channel,
  expensePlans,
  selectedPlanId,
  onSelectedPlanIdChange,
  plansLoading,
  disabled = false,
}: MarketingAccountExpensePlanLinkProps) {
  const t = useTranslations('marketing');
  const trimmedId = selectedPlanId.trim();
  const knownIds = new Set(expensePlans.map((plan) => plan.id));
  const selectValue = trimmedId ? trimmedId : NO_PLAN_VALUE;
  const linkedMissingFromList = Boolean(trimmedId) && !knownIds.has(trimmedId);
  const selectedPlan = expensePlans.find((plan) => plan.id === trimmedId);
  const selectedLabel = resolveExpensePlanSelectLabel({
    trimmedId,
    linkedMissingFromList,
    selectedPlan,
    noPlanLabel: t('settings.expensePlan.noPlanLinked'),
    missingLabel: t('settings.expensePlan.linkedMissingFromList'),
    chooseLabel: t('settings.expensePlan.choosePlan'),
  });

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label>{t('settings.expensePlan.title')}</Label>
        <div className="flex flex-wrap gap-x-3 text-sm">
          <Link
            href="/finance/expenses/plans"
            className="text-primary underline-offset-4 hover:underline"
          >
            {t('settings.expensePlan.allPlans')}
          </Link>
          {trimmedId ? (
            <Link
              href={expensePlansListWithOpenPlanHref(trimmedId)}
              className="text-primary underline-offset-4 hover:underline"
            >
              {t('settings.expensePlan.openSelected')}
            </Link>
          ) : null}
        </div>
      </div>
      {marketingAccountUsesPhone(channel) ? (
        <p className="text-muted-foreground text-xs">{t('settings.expensePlan.listAmHint')}</p>
      ) : null}
      <Select
        value={selectValue}
        onValueChange={(value) => {
          const next = value ?? '';
          onSelectedPlanIdChange(next === NO_PLAN_VALUE ? '' : next);
        }}
        disabled={plansLoading || disabled}
      >
        <SelectTrigger className="w-full min-w-0">
          <SelectValue
            placeholder={
              plansLoading
                ? t('settings.expensePlan.loadingPlans')
                : t('settings.expensePlan.choosePlan')
            }
          >
            {selectedLabel}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NO_PLAN_VALUE}>{t('settings.expensePlan.noPlanLinked')}</SelectItem>
          {linkedMissingFromList ? (
            <SelectItem value={trimmedId}>
              {t('settings.expensePlan.linkedMissingFromList')}
            </SelectItem>
          ) : null}
          {expensePlans.map((plan) => (
            <SelectItem key={plan.id} value={plan.id}>
              {planLabel(plan)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {linkedMissingFromList ? (
        <p className="text-destructive text-xs">{t('settings.expensePlan.missingPlanWarning')}</p>
      ) : null}
    </div>
  );
}
