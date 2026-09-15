'use client';

import { useCallback, useMemo } from 'react';
import Link from 'next/link';
import { ExternalLink, Plus, RefreshCw } from 'lucide-react';
import { EmptyState } from '@/components/shared';
import { Button, buttonVariants } from '@/components/ui/button';
import { SubscriptionDetailSheet } from '@/features/finance/components/subscriptions/SubscriptionDetailSheet';
import { SubscriptionFormDialog } from '@/features/finance/components/subscriptions/SubscriptionFormDialog';
import { FinanceSubscriptionsSection } from '@/features/projects/components/tabs/finance-tab-sections';
import { useProductEntityDetailSheet } from '@/features/projects/hooks/use-product-entity-detail-sheet';
import { filterProductFinanceSubscriptions } from '@/features/projects/utils/filter-product-finance-data';
import { buildProjectSubscriptionSeed } from '@/features/projects/utils/project-subscription-detail-seed';
import type { ProjectSubscription } from '@/lib/api/projects';
import { cn } from '@/lib/utils';

interface ProductFinanceSubscriptionsPanelProps {
  productId: string;
  productName: string;
  projectId: string;
  subscriptions: ProjectSubscription[];
  search: string;
  filters: Record<string, string>;
  canCreate: boolean;
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
  onSubscriptionsRefresh: () => void;
}

export function ProductFinanceSubscriptionsPanel({
  productId,
  productName,
  projectId,
  subscriptions,
  search,
  filters,
  canCreate,
  createOpen,
  onCreateOpenChange,
  onSubscriptionsRefresh,
}: ProductFinanceSubscriptionsPanelProps) {
  const subscriptionSheet = useProductEntityDetailSheet();
  const rows = useMemo(
    () => filterProductFinanceSubscriptions(subscriptions, search, filters),
    [filters, search, subscriptions],
  );

  const handleOpenSubscription = useCallback(
    (subscription: ProjectSubscription) => {
      subscriptionSheet.openEntity(subscription.id);
    },
    [subscriptionSheet],
  );

  const initialSubscription = useMemo(() => {
    if (!subscriptionSheet.entityId) return null;
    const row = subscriptions.find(
      (subscription) => subscription.id === subscriptionSheet.entityId,
    );
    return row ? buildProjectSubscriptionSeed(row, projectId) : null;
  }, [projectId, subscriptionSheet.entityId, subscriptions]);

  const emptyAction = canCreate ? (
    <Button type="button" size="sm" onClick={() => onCreateOpenChange(true)}>
      <Plus size={16} aria-hidden />
      New Subscription
    </Button>
  ) : (
    <Link
      href="/finance/subscriptions"
      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
    >
      Open Subscriptions in Finance
      <ExternalLink size={12} className="opacity-70" aria-hidden />
    </Link>
  );

  return (
    <>
      {rows.length === 0 ? (
        <EmptyState
          icon={RefreshCw}
          title="No subscriptions"
          description="No subscriptions match your filters for this product."
          action={emptyAction}
        />
      ) : (
        <FinanceSubscriptionsSection
          subscriptions={rows}
          onOpenSubscription={handleOpenSubscription}
        />
      )}
      <SubscriptionDetailSheet
        subscriptionId={subscriptionSheet.entityId}
        initialSubscription={initialSubscription}
        open={subscriptionSheet.isOpen}
        onOpenChange={subscriptionSheet.handleOpenChange}
        onSubscriptionUpdated={onSubscriptionsRefresh}
      />
      {canCreate ? (
        <SubscriptionFormDialog
          open={createOpen}
          onOpenChange={onCreateOpenChange}
          mode="create"
          defaultProductId={productId}
          defaultProjectId={projectId}
          defaultProductLabel={productName}
          onSaved={(created) => {
            onSubscriptionsRefresh();
            subscriptionSheet.openEntity(created.id);
          }}
        />
      ) : null}
    </>
  );
}
