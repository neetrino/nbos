'use client';

import { useState, type ReactNode } from 'react';
import { FileText, FolderKanban, LifeBuoy, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DetailSheetEntityLinkCard, DetailSheetEntityLinkGrid } from '@/components/shared';
import type {
  CompanyPortfolioResponse,
  ContactPortfolioResponse,
} from '@/lib/api/client-portfolio';
import { EntityDriveQuickAttach } from '@/features/drive/EntityDriveQuickAttach';
import { EntityDriveFilesPanel } from '@/features/drive/EntityDriveFilesPanel';
import {
  buildDriveHrefWithCompany,
  buildDriveHrefWithContact,
} from '@/features/drive/drive-deep-link';
import { OPEN_INVOICE_QUERY } from '@/features/finance/constants/invoice-deep-link';
import { getInvoiceMoneyStage } from '@/features/finance/constants/finance';
import { subscriptionsListWithOpenSubscriptionHref } from '@/features/finance/constants/subscription-deep-link';
import { SUPPORT_TICKET_OPEN_QUERY } from '@/features/support/constants/support-ticket-open-query';
import type { ClientPortfolioTabId } from './client-portfolio-tabs';
import { ClientPortfolioCommunicationPanel } from './ClientPortfolioCommunicationPanel';

export type { ClientPortfolioTabId } from './client-portfolio-tabs';

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

function PortfolioEmpty({ children }: { children: ReactNode }) {
  return <p className="text-muted-foreground text-sm">{children}</p>;
}

export function ClientPortfolioTabPanels({
  tab,
  data,
  variant,
  onRetry,
}: ClientPortfolioTabPanelsProps) {
  const [filesRefreshKey, setFilesRefreshKey] = useState(0);

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
    if (projects.length === 0) {
      return (
        <DetailSheetEntityLinkGrid empty={<PortfolioEmpty>No active projects.</PortfolioEmpty>} />
      );
    }
    return (
      <DetailSheetEntityLinkGrid>
        {projects.map((p) => {
          const id = String(p.id ?? '');
          const code = String(p.code ?? '');
          const name = String(p.name ?? '');
          const counts = p._count as { products?: number; extensions?: number } | undefined;
          const productCount = counts?.products ?? 0;
          const extensionCount = counts?.extensions ?? 0;
          const productContext = Array.isArray(p.productContext)
            ? (p.productContext as Array<{ name?: string; productType?: string }>)
            : [];
          const contextLabel =
            productContext.length > 0
              ? productContext
                  .map((row) => row.name || String(row.productType ?? '').replace(/_/g, ' '))
                  .filter(Boolean)
                  .join(', ')
              : null;
          return (
            <DetailSheetEntityLinkCard
              key={id}
              href={`/projects/${id}`}
              icon={FolderKanban}
              label={code || 'Project'}
              title={name || code || 'Untitled project'}
              description={
                contextLabel
                  ? `Products: ${contextLabel}`
                  : `${productCount} product${productCount === 1 ? '' : 's'} · ${extensionCount} extension${extensionCount === 1 ? '' : 's'}`
              }
            />
          );
        })}
      </DetailSheetEntityLinkGrid>
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
      <div className="space-y-3">
        {m.finance && !m.financeAmounts ? (
          <AccessNote message="Monetary amounts are hidden for your role; invoice status and codes are still visible." />
        ) : null}
        {invoices.length === 0 ? (
          <DetailSheetEntityLinkGrid
            empty={<PortfolioEmpty>No invoices in this view.</PortfolioEmpty>}
          />
        ) : (
          <DetailSheetEntityLinkGrid>
            {invoices.map((inv) => {
              const money = getInvoiceMoneyStage(inv.moneyStatus);
              const statusLabel = money?.label ?? inv.moneyStatus;
              return (
                <DetailSheetEntityLinkCard
                  key={inv.id}
                  href={`/finance/invoices?${OPEN_INVOICE_QUERY}=${encodeURIComponent(inv.id)}`}
                  icon={FileText}
                  label={inv.code}
                  title={statusLabel}
                  description={inv.amount ? String(inv.amount) : undefined}
                />
              );
            })}
          </DetailSheetEntityLinkGrid>
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
      <div className="space-y-3">
        {m.subscriptions && !m.financeAmounts ? (
          <AccessNote message="Subscription amounts are hidden for your role; status and codes remain visible." />
        ) : null}
        {subs.length === 0 ? (
          <DetailSheetEntityLinkGrid empty={<PortfolioEmpty>No subscriptions.</PortfolioEmpty>} />
        ) : (
          <DetailSheetEntityLinkGrid>
            {subs.map((s) => (
              <DetailSheetEntityLinkCard
                key={s.id}
                href={subscriptionsListWithOpenSubscriptionHref(s.id)}
                icon={Repeat}
                label={s.code}
                title={s.status}
                description={s.amount ? String(s.amount) : undefined}
              />
            ))}
          </DetailSheetEntityLinkGrid>
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
    if (tickets.length === 0) {
      return <DetailSheetEntityLinkGrid empty={<PortfolioEmpty>No tickets.</PortfolioEmpty>} />;
    }
    return (
      <DetailSheetEntityLinkGrid>
        {tickets.map((t) => (
          <DetailSheetEntityLinkCard
            key={t.id}
            href={`/support?${SUPPORT_TICKET_OPEN_QUERY}=${encodeURIComponent(t.id)}`}
            icon={LifeBuoy}
            label={t.code}
            title={t.title}
            description={t.status}
          />
        ))}
      </DetailSheetEntityLinkGrid>
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
    const scopeId =
      data.scope === 'contact'
        ? String((data.contact as { id?: string }).id ?? '')
        : String((data.company as { id?: string }).id ?? '');
    const entityType = data.scope === 'contact' ? 'CONTACT' : 'COMPANY';
    const driveHref =
      data.scope === 'contact'
        ? buildDriveHrefWithContact(scopeId)
        : buildDriveHrefWithCompany(scopeId);

    if (tab === 'communication') {
      return (
        <ClientPortfolioCommunicationPanel
          data={data}
          contactId={data.scope === 'contact' ? scopeId : null}
        />
      );
    }

    return (
      <div className="space-y-4">
        <EntityDriveQuickAttach
          entityType={entityType}
          entityId={scopeId}
          libraryKey="clients"
          onUploaded={() => setFilesRefreshKey((key) => key + 1)}
        />
        <EntityDriveFilesPanel
          entityType={entityType}
          entityId={scopeId}
          driveHref={driveHref}
          refreshKey={filesRefreshKey}
        />
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
