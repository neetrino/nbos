'use client';

import Link from 'next/link';
import { FileText } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { DetailSheetSection } from '@/components/shared';
import { formatAmount } from '@/features/finance/constants/finance';
import { subscriptionInvoicesDrilldownHref } from '@/features/finance/constants/subscription-invoice-drilldown';
import { cn } from '@/lib/utils';
import type { Subscription } from '@/lib/api/finance';

interface SubscriptionInvoicesTabProps {
  subscription: Subscription;
}

export function SubscriptionInvoicesTab({ subscription }: SubscriptionInvoicesTabProps) {
  const invoices = subscription.invoices ?? [];

  return (
    <DetailSheetSection title="Invoices" icon={<FileText size={12} />}>
      {invoices.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No invoices linked to this subscription yet.
        </p>
      ) : (
        <ul className="space-y-2 text-sm">
          {invoices.map((inv) => (
            <li
              key={inv.id}
              className="border-border flex flex-wrap items-baseline justify-between gap-2 border-b pb-2 last:border-0 last:pb-0"
            >
              <span className="font-mono text-xs">{inv.code}</span>
              <span className="text-muted-foreground text-xs">{inv.moneyStatus}</span>
              <span className="font-medium tabular-nums">
                {formatAmount(parseFloat(inv.amount))}
              </span>
            </li>
          ))}
        </ul>
      )}
      <Link
        href={subscriptionInvoicesDrilldownHref(subscription.id)}
        className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'mt-4 gap-1.5')}
      >
        <FileText size={14} aria-hidden />
        Open in Finance → Invoices
      </Link>
    </DetailSheetSection>
  );
}
