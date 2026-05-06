import type { ReactNode } from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { formatAmount } from '@/features/finance/constants/finance';
import { OPEN_INVOICE_QUERY } from '@/features/finance/constants/invoice-deep-link';
import { EXPENSE_PLAN_DRILLDOWN_QUERY } from '@/features/finance/constants/project-expenses-drilldown';
import type { ClientServiceFinanceLinks } from '@/lib/api/client-services';

function invoiceHref(invoiceId: string): string {
  const q = new URLSearchParams({ [OPEN_INVOICE_QUERY]: invoiceId });
  return `/finance/invoices?${q.toString()}`;
}

function expensePlanHref(planId: string): string {
  const q = new URLSearchParams({ [EXPENSE_PLAN_DRILLDOWN_QUERY]: planId });
  return `/finance/expenses?${q.toString()}`;
}

function taskHref(task: ClientServiceFinanceLinks['tasks'][0]): string {
  if (task.workspaceId) {
    return `/work-spaces/${task.workspaceId}`;
  }
  return '/tasks';
}

interface ClientServiceFinanceLinksPanelProps {
  links: ClientServiceFinanceLinks;
}

export function ClientServiceFinanceLinksPanel({ links }: ClientServiceFinanceLinksPanelProps) {
  const hasAny =
    links.invoices.length > 0 ||
    links.expensePlans.length > 0 ||
    links.expenses.length > 0 ||
    links.tasks.length > 0;

  if (!hasAny) {
    return (
      <p className="text-muted-foreground border-border rounded-lg border border-dashed p-3 text-sm">
        No linked invoice cards, expense plans, expense cards, or tasks yet. Use the actions on the
        list row to create links.
      </p>
    );
  }

  return (
    <div className="border-border space-y-4 rounded-lg border p-3">
      <h3 className="text-sm font-semibold">Linked finance & tasks</h3>
      {links.invoices.length > 0 ? (
        <LinkSubsection title="Invoice cards">
          <ul className="space-y-1 text-sm">
            {links.invoices.map((inv) => (
              <li key={inv.id}>
                <Link
                  href={invoiceHref(inv.id)}
                  className="text-primary inline-flex items-center gap-1 hover:underline"
                >
                  {inv.code}
                  <span className="text-muted-foreground">
                    · {formatAmount(Number(inv.amount))} · {inv.moneyStatus}
                  </span>
                  <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
                </Link>
              </li>
            ))}
          </ul>
        </LinkSubsection>
      ) : null}
      {links.expensePlans.length > 0 ? (
        <LinkSubsection title="Expense plans">
          <ul className="space-y-1 text-sm">
            {links.expensePlans.map((plan) => (
              <li key={plan.id}>
                <Link
                  href={expensePlanHref(plan.id)}
                  className="text-primary inline-flex items-center gap-1 hover:underline"
                >
                  {plan.name}
                  <span className="text-muted-foreground">
                    · {formatAmount(Number(plan.amount))}
                  </span>
                  <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
                </Link>
              </li>
            ))}
          </ul>
        </LinkSubsection>
      ) : null}
      {links.expenses.length > 0 ? (
        <LinkSubsection title="Expense cards">
          <ul className="space-y-1 text-sm">
            {links.expenses.map((exp) => (
              <li key={exp.id}>
                <Link
                  href={`/finance/expenses/${exp.id}`}
                  className="text-primary inline-flex items-center gap-1 hover:underline"
                >
                  {exp.name}
                  <span className="text-muted-foreground">
                    · {formatAmount(Number(exp.amount))} · {exp.status}
                  </span>
                  <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
                </Link>
              </li>
            ))}
          </ul>
        </LinkSubsection>
      ) : null}
      {links.tasks.length > 0 ? (
        <LinkSubsection title="Tasks">
          <ul className="space-y-1 text-sm">
            {links.tasks.map((task) => (
              <li key={task.id}>
                <Link
                  href={taskHref(task)}
                  className="text-primary inline-flex items-center gap-1 hover:underline"
                >
                  {task.title}
                  <span className="text-muted-foreground">· {task.status}</span>
                  <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
                </Link>
              </li>
            ))}
          </ul>
        </LinkSubsection>
      ) : null}
    </div>
  );
}

function LinkSubsection(props: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
        {props.title}
      </p>
      {props.children}
    </div>
  );
}
