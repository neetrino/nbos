'use client';

import Link from 'next/link';
import { expensePlansListWithOpenPlanHref } from '@/features/finance/constants/expense-plan-deep-link';
import type { ExpensePlan } from '@/lib/api/expense-plans';
import type { MarketingAccount } from '@/lib/api/marketing';
import { Button } from '@/components/ui/button';
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

export interface MarketingAccountExpensePlanLinkProps {
  account: MarketingAccount;
  expensePlans: ExpensePlan[];
  selectedPlanId: string;
  onSelectedPlanIdChange: (planId: string) => void;
  onSave: () => void | Promise<void>;
  saving: boolean;
  plansLoading: boolean;
}

export function MarketingAccountExpensePlanLink({
  account,
  expensePlans,
  selectedPlanId,
  onSelectedPlanIdChange,
  onSave,
  saving,
  plansLoading,
}: MarketingAccountExpensePlanLinkProps) {
  const trimmedId = selectedPlanId.trim();
  const knownIds = new Set(expensePlans.map((p) => p.id));
  const selectValue = trimmedId ? trimmedId : NO_PLAN_VALUE;
  const linkedMissingFromList = Boolean(trimmedId) && !knownIds.has(trimmedId);

  return (
    <div className="mt-4 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label>Finance expense plan</Label>
        <div className="flex flex-wrap gap-x-3 text-sm">
          <Link
            href="/finance/expenses/plans"
            className="text-primary underline-offset-4 hover:underline"
          >
            All plans
          </Link>
          {selectedPlanId.trim() ? (
            <Link
              href={expensePlansListWithOpenPlanHref(selectedPlanId.trim())}
              className="text-primary underline-offset-4 hover:underline"
            >
              Open selected plan
            </Link>
          ) : null}
        </div>
      </div>
      {account.channel === 'LIST_AM' ? (
        <p className="text-muted-foreground text-xs">
          List.am spend is tracked per marketing account. Link the recurring subscription (or
          equivalent) expense plan so paid and planned amounts flow into marketing analytics.
        </p>
      ) : null}
      <div className="flex gap-2">
        <Select
          value={selectValue}
          onValueChange={(value) => {
            const next = value ?? '';
            onSelectedPlanIdChange(next === NO_PLAN_VALUE ? '' : next);
          }}
          disabled={plansLoading}
        >
          <SelectTrigger className="min-w-0 flex-1">
            <SelectValue placeholder={plansLoading ? 'Loading plans…' : 'Choose a plan'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_PLAN_VALUE}>No plan linked</SelectItem>
            {linkedMissingFromList ? (
              <SelectItem value={trimmedId}>Linked plan (not in Marketing list)</SelectItem>
            ) : null}
            {expensePlans.map((plan) => (
              <SelectItem key={plan.id} value={plan.id}>
                {planLabel(plan)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => void onSave()} disabled={saving || plansLoading}>
          {saving ? 'Saving…' : 'Save link'}
        </Button>
      </div>
      {linkedMissingFromList ? (
        <p className="text-destructive text-xs">
          This account points to a plan that is missing or inaccessible. Pick a current plan or
          clear the link.
        </p>
      ) : null}
    </div>
  );
}
