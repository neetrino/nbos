'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { ErrorState, LoadingState } from '@/components/shared';
import { subscriptionDetailPageTitle } from '@/features/finance/constants/finance-route-page-titles';
import { SubscriptionDetailBody } from '@/features/finance/components/subscriptions/SubscriptionDetailBody';
import { SubscriptionFormDialog } from '@/features/finance/components/subscriptions/SubscriptionFormDialog';
import { useFinanceDocumentTitle } from '@/features/finance/hooks/use-finance-document-title';
import { getApiErrorMessage } from '@/lib/api-errors';
import { cn } from '@/lib/utils';
import { subscriptionsApi, type Subscription } from '@/lib/api/finance';

export default function SubscriptionDetailPage() {
  const params = useParams<{ id: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const fetchSubscription = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await subscriptionsApi.getById(id);
      setSubscription(data);
      setError(null);
      setActionError(null);
    } catch (caught) {
      setSubscription(null);
      setError(
        getApiErrorMessage(caught, 'Subscription could not be loaded. It may have been removed.'),
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchSubscription();
  }, [fetchSubscription]);

  useFinanceDocumentTitle(
    subscriptionDetailPageTitle({
      loading,
      loadFailed: Boolean(error || !subscription),
      subscriptionCode: subscription?.code,
    }),
  );

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
        <ErrorState description={error ?? 'Not found'} onRetry={() => void fetchSubscription()} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-4xl flex-col gap-6 px-1">
      <div className="flex items-start gap-3">
        <Link
          href="/finance/subscriptions"
          className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'mt-0.5 shrink-0')}
          aria-label="Back to subscriptions"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-foreground text-2xl font-semibold tracking-tight">
            {subscription.code}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">{subscription.project.name}</p>
        </div>
      </div>

      <SubscriptionDetailBody
        subscription={subscription}
        onSubscriptionChange={setSubscription}
        actionError={actionError}
        onDismissActionError={() => setActionError(null)}
        onActionError={setActionError}
        onEditBilling={() => setEditOpen(true)}
      />

      <SubscriptionFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        subscription={subscription}
        onSaved={(updated) => {
          setSubscription(updated);
          setActionError(null);
        }}
      />
    </div>
  );
}
