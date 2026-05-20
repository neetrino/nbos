'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ExternalLink, FileText, FolderKanban } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { DetailSheetSection, ListMutationErrorBanner } from '@/components/shared';
import { DETAIL_SHEET_PAIRED_COLUMNS_CLASS } from '@/components/shared/detail-sheet-classes';
import {
  formatAmount,
  getSubscriptionBillingFrequency,
} from '@/features/finance/constants/finance';
import { PARTNER_OPEN_QUERY } from '@/features/partners/constants/partner-open-query';
import { subscriptionInvoicesDrilldownHref } from '@/features/finance/constants/subscription-invoice-drilldown';
import { cn } from '@/lib/utils';
import type { Subscription } from '@/lib/api/finance';
import { formatSubscriptionDetailDate } from './subscription-detail-format';
import { SubscriptionDetailActions } from './SubscriptionDetailActions';

export interface SubscriptionDetailBodyProps {
  subscription: Subscription;
  onSubscriptionChange: (updated: Subscription) => void;
  actionError: string | null;
  onDismissActionError: () => void;
  onActionError: (message: string | null) => void;
  onEditBilling: () => void;
  headerActions?: ReactNode;
}

export function SubscriptionDetailBody({
  subscription,
  onSubscriptionChange,
  actionError,
  onDismissActionError,
  onActionError,
  onEditBilling,
  headerActions,
}: SubscriptionDetailBodyProps) {
  const invoiceCount = subscription.invoices?.length ?? 0;
  const billingFreq =
    getSubscriptionBillingFrequency(subscription.billingFrequency)?.label ??
    subscription.billingFrequency;

  return (
    <div className="space-y-5">
      {actionError ? (
        <ListMutationErrorBanner
          message={actionError}
          onDismiss={onDismissActionError}
          dismissAriaLabel="Dismiss subscription action error"
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <Metric label="Coverage" value={`${subscription.coverage?.activeMonthCount ?? 0} months`} />
        <Metric label="Billing day" value={`${subscription.billingDay}`} />
        <Metric label="Frequency" value={billingFreq} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {headerActions}
        <Button type="button" variant="outline" size="sm" onClick={onEditBilling}>
          Edit billing
        </Button>
        <SubscriptionDetailActions
          subscription={subscription}
          onSubscriptionChange={onSubscriptionChange}
          onError={onActionError}
        />
        <Link
          href={subscriptionInvoicesDrilldownHref(subscription.id)}
          className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'gap-1.5')}
        >
          <FileText size={16} aria-hidden />
          Invoices
        </Link>
      </div>

      <DetailSheetSection title="Billing">
        <div className={DETAIL_SHEET_PAIRED_COLUMNS_CLASS}>
          <div className="space-y-3 text-sm">
            <FieldRow label="Tax" value={subscription.taxStatus} />
          </div>
          <div className="space-y-3 text-sm">
            <FieldRow
              label="Notifications"
              value={subscription.notificationsEnabled ? 'Enabled' : 'Disabled'}
            />
            <FieldRow
              label="Started"
              value={formatSubscriptionDetailDate(subscription.billingStartDate)}
            />
            {subscription.endDate ? (
              <FieldRow label="Ended" value={formatSubscriptionDetailDate(subscription.endDate)} />
            ) : null}
          </div>
        </div>
      </DetailSheetSection>

      <DetailSheetSection title="Linked">
        <div className="space-y-3 text-sm">
          <LinkRow
            icon={FolderKanban}
            label="Project"
            value={subscription.project.name}
            href={`/projects/${subscription.projectId}`}
          />
          {subscription.company ? (
            <FieldRow label="Company" value={subscription.company.name} />
          ) : null}
          {subscription.partner ? (
            <LinkRow
              icon={ExternalLink}
              label="Partner"
              value={subscription.partner.name}
              href={`/partners?${PARTNER_OPEN_QUERY}=${encodeURIComponent(subscription.partner.id)}`}
            />
          ) : (
            <FieldRow label="Partner" value="None linked" />
          )}
        </div>
      </DetailSheetSection>

      <DetailSheetSection title={`Invoices (${invoiceCount})`}>
        {invoiceCount === 0 ? (
          <p className="text-muted-foreground text-sm">No invoices yet for this subscription.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {subscription.invoices.slice(0, 12).map((inv) => (
              <li key={inv.id} className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-mono text-xs">{inv.code}</span>
                <span className="text-muted-foreground">{inv.moneyStatus}</span>
                <span className="tabular-nums">{formatAmount(parseFloat(inv.amount))}</span>
              </li>
            ))}
          </ul>
        )}
        <Link
          href={subscriptionInvoicesDrilldownHref(subscription.id)}
          className="text-primary mt-3 inline-block text-xs font-medium hover:underline"
        >
          Open in Finance → Invoices
        </Link>
      </DetailSheetSection>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-foreground font-medium">{value}</span>
    </div>
  );
}

function LinkRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof FolderKanban;
  label: string;
  value: string;
  href: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="text-muted-foreground text-xs">{label}</span>
      <Link
        href={href}
        className="text-primary inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
      >
        <Icon size={14} aria-hidden />
        {value}
        <ExternalLink size={12} className="opacity-70" aria-hidden />
      </Link>
    </div>
  );
}
