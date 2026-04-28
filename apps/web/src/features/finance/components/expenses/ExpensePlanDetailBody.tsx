'use client';

import Link from 'next/link';
import { formatAmount } from '@/features/finance/constants/finance';
import {
  expensePlanFrequencyLabel,
  formatExpensePlanShortDate,
} from '@/features/finance/utils/expense-plan-display';
import type { ExpensePlan } from '@/lib/api/expense-plans';

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border bg-card rounded-xl border p-4">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="text-foreground mt-2 text-sm font-medium">{value}</p>
    </div>
  );
}

export interface ExpensePlanDetailBodyProps {
  plan: ExpensePlan;
}

export function ExpensePlanDetailBody({ plan }: ExpensePlanDetailBodyProps) {
  return (
    <>
      <p className="text-muted-foreground text-sm">
        Read-only summary from NBOS Expense Plan. Edit or delete the plan from the plans list; use
        Refresh after list changes.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Amount" value={formatAmount(Number(plan.amount))} />
        <Field label="Category" value={plan.category} />
        <Field label="Frequency" value={expensePlanFrequencyLabel(plan.frequency)} />
        <Field label="Next due" value={formatExpensePlanShortDate(plan.nextDueDate)} />
        <Field label="Auto-generate" value={plan.autoGenerate ? 'Yes' : 'No'} />
        <Field label="Linked expense cards" value={String(plan._count.expenses)} />
        <Field label="Provider" value={plan.provider?.trim() || '—'} />
        <Field
          label="Project"
          value={plan.project ? `${plan.project.code} · ${plan.project.name}` : '—'}
        />
      </div>

      {plan.project ? (
        <p className="text-muted-foreground text-sm">
          Project hub:{' '}
          <Link
            href={`/projects/${plan.project.id}`}
            className="text-primary font-medium hover:underline"
          >
            {plan.project.name}
          </Link>
        </p>
      ) : null}

      {plan.notes?.trim() ? (
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Notes</p>
          <p className="text-foreground mt-2 text-sm whitespace-pre-wrap">{plan.notes}</p>
        </div>
      ) : null}
    </>
  );
}
