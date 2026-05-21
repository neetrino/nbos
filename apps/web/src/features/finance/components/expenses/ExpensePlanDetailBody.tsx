'use client';

import Link from 'next/link';
import { formatAmount } from '@/features/finance/constants/finance';
import { planExpensesDrilldownHref } from '@/features/finance/constants/project-expenses-drilldown';
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
        NBOS Expense Plan summary. Use header actions to edit or delete; Refresh reloads from the
        server.
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

      <p className="text-muted-foreground text-sm">
        Expense cards:{' '}
        <Link
          href={planExpensesDrilldownHref(plan.id)}
          className="text-primary font-medium hover:underline"
        >
          View on expense board
        </Link>{' '}
        (all statuses, current period filter applies on the list).
      </p>

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
