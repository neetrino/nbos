'use client';

import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type {
  CompanyPortfolioResponse,
  ContactPortfolioResponse,
} from '@/lib/api/client-portfolio';
import {
  PORTFOLIO_DRIVE_HREF,
  PORTFOLIO_MESSENGER_HREF,
} from '../../constants/client-portfolio-deep-links';

export type ClientPortfolioTabId =
  | 'overview'
  | 'projects'
  | 'finance'
  | 'subscriptions'
  | 'support'
  | 'communication'
  | 'files';

export interface ClientPortfolioTabPanelsProps {
  tab: ClientPortfolioTabId;
  data: ContactPortfolioResponse | CompanyPortfolioResponse;
  variant: 'contact' | 'company';
  onRetry: () => void;
}

function AccessNote({ message }: { message: string }) {
  return (
    <p className="text-muted-foreground mb-3 border-l-2 border-amber-500/80 pl-3 text-xs">
      {message}
    </p>
  );
}

export function ClientPortfolioTabPanels({
  tab,
  data,
  variant,
  onRetry,
}: ClientPortfolioTabPanelsProps) {
  if (tab === 'overview') {
    const s = data.summary;
    const m = data.accessMask;
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard label="Projects" value={String(s.projectCount)} />
        {'companyCount' in s && <MetricCard label="Companies" value={String(s.companyCount)} />}
        {m.support && <MetricCard label="Open tickets" value={String(s.openTicketCount)} />}
        {m.finance && (
          <>
            <MetricCard label="Outstanding invoices" value={String(s.outstandingInvoiceCount)} />
            <MetricCard label="Overdue / awaiting" value={String(s.overdueInvoiceCount)} />
            <MetricCard label="Paid invoices" value={String(s.paidInvoiceCount)} />
          </>
        )}
        {m.subscriptions && (
          <MetricCard label="Active subscriptions" value={String(s.subscriptionActiveCount)} />
        )}
        <div className="border-border bg-muted/30 text-muted-foreground rounded-xl border p-4 text-xs sm:col-span-2 lg:col-span-3">
          <p className="text-foreground font-medium">Next actions</p>
          <p className="mt-1">
            {m.finance && s.overdueInvoiceCount > 0
              ? 'Follow up on overdue or awaiting invoices with the billing contact.'
              : 'No urgent invoice issues detected in this portfolio slice.'}
          </p>
          <Button
            type="button"
            variant="link"
            className="mt-2 h-auto px-0 text-xs"
            onClick={() => onRetry()}
          >
            Refresh data
          </Button>
        </div>
      </div>
    );
  }

  if (tab === 'projects') {
    const projects =
      variant === 'contact' && data.scope === 'contact'
        ? ((data.contact as { projects?: Array<Record<string, unknown>> }).projects ?? [])
        : data.scope === 'company'
          ? ((data.company as { projects?: Array<Record<string, unknown>> }).projects ?? [])
          : [];
    return (
      <div className="space-y-2">
        {projects.length === 0 ? (
          <p className="text-muted-foreground text-sm">No active projects.</p>
        ) : (
          <ul className="divide-border divide-y rounded-xl border">
            {projects.map((p) => {
              const id = String(p.id ?? '');
              const code = String(p.code ?? '');
              const name = String(p.name ?? '');
              const counts = p._count as { products?: number; extensions?: number } | undefined;
              return (
                <li
                  key={id}
                  className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm"
                >
                  <div>
                    <p className="font-medium">
                      {code} · {name}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Products {counts?.products ?? 0} · Extensions {counts?.extensions ?? 0}
                    </p>
                  </div>
                  <Link
                    href={`/projects/${id}`}
                    className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                  >
                    Open hub
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  }

  if (tab === 'finance') {
    const invoices = data.invoices as Array<{
      id: string;
      code: string;
      moneyStatus: string;
      amount: string | null;
      projectId: string;
    }>;
    const m = data.accessMask;
    return (
      <div className="space-y-2">
        {m.finance && !m.financeAmounts && (
          <AccessNote message="Monetary amounts are hidden for your role; invoice status and codes are still visible." />
        )}
        {invoices.length === 0 ? (
          <p className="text-muted-foreground text-sm">No invoices in this view.</p>
        ) : (
          <ul className="divide-border divide-y rounded-xl border">
            {invoices.map((inv) => (
              <li
                key={inv.id}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm"
              >
                <div>
                  <p className="font-mono text-xs font-medium">{inv.code}</p>
                  <p className="text-muted-foreground text-xs">
                    {inv.moneyStatus}
                    {inv.amount ? ` · ${inv.amount}` : ''}
                  </p>
                </div>
                <Link
                  href={`/projects/${inv.projectId}`}
                  className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
                >
                  Project
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (tab === 'subscriptions') {
    const subs = data.subscriptions as Array<{
      id: string;
      code: string;
      status: string;
      amount: string | null;
      projectId: string;
    }>;
    const m = data.accessMask;
    return (
      <div className="space-y-2">
        {m.subscriptions && !m.financeAmounts && (
          <AccessNote message="Subscription amounts are hidden for your role; status and codes remain visible." />
        )}
        {subs.length === 0 ? (
          <p className="text-muted-foreground text-sm">No subscriptions.</p>
        ) : (
          <ul className="divide-border divide-y rounded-xl border">
            {subs.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm"
              >
                <div>
                  <p className="font-mono text-xs font-medium">{s.code}</p>
                  <p className="text-muted-foreground text-xs">
                    {s.status}
                    {s.amount ? ` · ${s.amount}` : ''}
                  </p>
                </div>
                <Link
                  href={`/projects/${s.projectId}`}
                  className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
                >
                  Project
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (tab === 'support') {
    const tickets = data.tickets as Array<{
      id: string;
      code: string;
      status: string;
      title: string;
      projectId: string;
    }>;
    return (
      <div className="space-y-2">
        {tickets.length === 0 ? (
          <p className="text-muted-foreground text-sm">No tickets.</p>
        ) : (
          <ul className="divide-border divide-y rounded-xl border">
            {tickets.map((t) => (
              <li key={t.id} className="px-3 py-2.5 text-sm">
                <p className="font-mono text-xs font-medium">{t.code}</p>
                <p className="font-medium">{t.title}</p>
                <p className="text-muted-foreground text-xs">
                  {t.status} ·{' '}
                  <Link className="text-primary hover:underline" href={`/projects/${t.projectId}`}>
                    Project
                  </Link>
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (tab === 'communication' || tab === 'files') {
    const m = data.accessMask;
    const allowed = tab === 'communication' ? m.communication : m.files;
    if (!allowed) {
      return (
        <p className="text-muted-foreground text-sm">
          You do not have permission to view this section. Ask an administrator if you need access
          to {tab === 'communication' ? 'Messenger / mail' : 'Drive'}.
        </p>
      );
    }
    const scopeLabel = data.scope === 'contact' ? 'Contact' : 'Company';
    const scopeId =
      data.scope === 'contact'
        ? String((data.contact as { id?: string }).id ?? '')
        : String((data.company as { id?: string }).id ?? '');

    return (
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">
          {tab === 'communication'
            ? 'A unified timeline (Messenger, calls, notes) will appear here when the aggregation API is available.'
            : 'Files stay in Drive; this tab will deep-link to client-scoped folders when the Drive UI exposes that filter.'}
        </p>
        {tab === 'communication' ? (
          <Link
            href={PORTFOLIO_MESSENGER_HREF}
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'inline-flex w-fit gap-2',
            )}
          >
            Open Messenger
          </Link>
        ) : (
          <Link
            href={PORTFOLIO_DRIVE_HREF}
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'inline-flex w-fit gap-2',
            )}
          >
            Open Drive
          </Link>
        )}
        <p className="text-muted-foreground text-xs">
          {scopeLabel} context ID: <span className="text-foreground font-mono">{scopeId}</span>
        </p>
      </div>
    );
  }

  return null;
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border bg-card rounded-xl border p-4">
      <p className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
