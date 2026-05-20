'use client';

import Link from 'next/link';
import { ExternalLink, FileText, FolderKanban } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { DetailSheetSection } from '@/components/shared';
import { formatAmount } from '@/features/finance/constants/finance';
import { subscriptionInvoicesDrilldownHref } from '@/features/finance/constants/subscription-invoice-drilldown';
import { PARTNER_OPEN_QUERY } from '@/features/partners/constants/partner-open-query';
import { cn } from '@/lib/utils';
import type { Subscription } from '@/lib/api/finance';

export function SubscriptionDetailLinkedPanel({ subscription }: { subscription: Subscription }) {
  const invoiceCount = subscription.invoices?.length ?? 0;

  return (
    <>
      <DetailSheetSection title="Linked">
        <div className="space-y-2 text-sm">
          <LinkRow
            icon={FolderKanban}
            value={subscription.project.name}
            href={`/projects/${subscription.projectId}`}
          />
          {subscription.company ? (
            <p className="text-muted-foreground">
              <span className="text-foreground font-medium">{subscription.company.name}</span>
            </p>
          ) : null}
          {subscription.partner ? (
            <LinkRow
              icon={ExternalLink}
              value={subscription.partner.name}
              href={`/partners?${PARTNER_OPEN_QUERY}=${encodeURIComponent(subscription.partner.id)}`}
            />
          ) : null}
        </div>
      </DetailSheetSection>

      <DetailSheetSection title={`Invoices (${invoiceCount})`}>
        {invoiceCount === 0 ? (
          <p className="text-muted-foreground text-sm">No invoices yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {subscription.invoices.slice(0, 8).map((inv) => (
              <li key={inv.id} className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-mono text-xs">{inv.code}</span>
                <span className="text-muted-foreground text-xs">{inv.moneyStatus}</span>
                <span className="tabular-nums">{formatAmount(parseFloat(inv.amount))}</span>
              </li>
            ))}
          </ul>
        )}
        <Link
          href={subscriptionInvoicesDrilldownHref(subscription.id)}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-3 w-full')}
        >
          <FileText size={14} aria-hidden />
          All invoices
        </Link>
      </DetailSheetSection>
    </>
  );
}

function LinkRow({
  icon: Icon,
  value,
  href,
}: {
  icon: typeof FolderKanban;
  value: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="text-primary inline-flex items-center gap-1.5 font-medium hover:underline"
    >
      <Icon size={14} aria-hidden />
      {value}
      <ExternalLink size={12} className="opacity-70" aria-hidden />
    </Link>
  );
}
