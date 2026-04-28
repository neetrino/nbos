'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, ExternalLink, FileText, FolderKanban, RefreshCcw } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { ErrorState, LoadingState, StatusBadge } from '@/components/shared';
import {
  formatAmount,
  getSubscriptionStatus,
  getSubscriptionType,
} from '@/features/finance/constants/finance';
import { subscriptionInvoicesDrilldownHref } from '@/features/finance/constants/subscription-invoice-drilldown';
import { cn } from '@/lib/utils';
import { SubscriptionDetailActions } from '@/features/finance/components/subscriptions/SubscriptionDetailActions';
import { subscriptionsApi, type Subscription } from '@/lib/api/finance';

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function SubscriptionDetailPage() {
  const params = useParams<{ id: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await subscriptionsApi.getById(id);
      setSubscription(data);
      setError(null);
      setActionError(null);
    } catch {
      setSubscription(null);
      setError('Subscription could not be loaded. It may have been removed.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  if (loading) {
    return (
      <div className="flex h-full flex-col gap-5">
        <LoadingState count={4} />
      </div>
    );
  }

  if (error || !subscription) {
    return (
      <div className="flex h-full flex-col gap-5">
        <div className="flex items-center gap-2">
          <Link
            href="/finance/subscriptions"
            className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}
            aria-label="Back to subscriptions"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-foreground text-2xl font-semibold">Subscription</h1>
        </div>
        <ErrorState description={error ?? 'Not found'} onRetry={fetchSubscription} />
      </div>
    );
  }

  const subType = getSubscriptionType(subscription.type);
  const subStatus = getSubscriptionStatus(subscription.status);
  const invoiceCount = subscription.invoices?.length ?? 0;

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link
            href="/finance/subscriptions"
            className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'mt-0.5 shrink-0')}
            aria-label="Back to subscriptions"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-foreground text-2xl font-semibold">{subscription.code}</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Started {formatDate(subscription.startDate)}
              {subscription.endDate ? ` · Ended ${formatDate(subscription.endDate)}` : ''}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="icon" type="button" onClick={fetchSubscription}>
            <RefreshCcw size={16} />
          </Button>
          <SubscriptionDetailActions
            subscription={subscription}
            onSubscriptionChange={setSubscription}
            onError={setActionError}
          />
          <Link
            href={subscriptionInvoicesDrilldownHref(subscription.id)}
            className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'gap-1.5')}
          >
            <FileText size={16} />
            Invoices
          </Link>
        </div>
      </div>

      {actionError ? (
        <p className="text-destructive text-sm" role="alert">
          {actionError}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Status</p>
          <div className="mt-2">
            {subStatus ? (
              <StatusBadge label={subStatus.label} variant={subStatus.variant} />
            ) : (
              subscription.status
            )}
          </div>
        </div>
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Type</p>
          <div className="mt-2">
            {subType ? (
              <StatusBadge label={subType.label} variant={subType.variant} />
            ) : (
              subscription.type
            )}
          </div>
        </div>
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Amount / month</p>
          <p className="mt-2 text-lg font-semibold tabular-nums">
            {formatAmount(parseFloat(subscription.amount))}
          </p>
        </div>
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Coverage</p>
          <p className="mt-2 text-lg font-semibold tabular-nums">
            {subscription.coverage?.activeMonthCount ?? 0} months
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Billing day</p>
          <p className="mt-2 font-medium">{subscription.billingDay}</p>
        </div>
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Tax status</p>
          <p className="mt-2 font-medium">{subscription.taxStatus}</p>
        </div>
      </div>

      <div className="border-border bg-card rounded-xl border p-4">
        <p className="text-muted-foreground text-xs">Project</p>
        <Link
          href={`/projects/${subscription.projectId}`}
          className="text-primary mt-2 inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
        >
          <FolderKanban size={14} />
          {subscription.project.name}
          <ExternalLink size={12} className="opacity-70" aria-hidden />
        </Link>
      </div>

      <div className="border-border bg-card rounded-xl border p-4">
        <p className="text-muted-foreground text-xs">Partner</p>
        <div className="mt-2 text-sm">
          {subscription.partner ? (
            <Link
              href={`/partners/${subscription.partner.id}`}
              className="text-primary inline-flex items-center gap-1.5 font-medium hover:underline"
            >
              {subscription.partner.name}
              <ExternalLink size={12} className="opacity-70" aria-hidden />
            </Link>
          ) : (
            <span className="text-muted-foreground">None linked</span>
          )}
        </div>
      </div>

      <div className="border-border bg-card rounded-xl border p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-muted-foreground text-xs">Linked invoices ({invoiceCount})</p>
          <Link
            href={subscriptionInvoicesDrilldownHref(subscription.id)}
            className="text-primary text-xs font-medium hover:underline"
          >
            Open in Finance → Invoices
          </Link>
        </div>
        {invoiceCount === 0 ? (
          <p className="text-muted-foreground mt-3 text-sm">
            No invoices yet for this subscription.
          </p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {subscription.invoices.slice(0, 12).map((inv) => (
              <li key={inv.id} className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-mono text-xs">{inv.code}</span>
                <span className="text-muted-foreground">{inv.status}</span>
                <span className="tabular-nums">{formatAmount(parseFloat(inv.amount))}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
