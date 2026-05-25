import { Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, ListMutationErrorBanner, LoadingState } from '@/components/shared';
import type { Subscription, SubscriptionGridPayload } from '@/lib/api/finance';
import { SubscriptionCoverageGrid } from './SubscriptionCoverageGrid';

interface SubscriptionsPageContentProps {
  gridYear: number;
  onGridYearChange: (year: number) => void;
  gridPayload: SubscriptionGridPayload | null;
  gridLoading: boolean;
  gridError: string | null;
  onGridRetry: () => void;
  subscriptions: Subscription[];
  listLoading: boolean;
  listError: string | null;
  mutationError: string | null;
  onDismissMutationError: () => void;
  onListRetry: () => void;
  activatingId: string | null;
  cancellingId: string | null;
  holdingId: string | null;
  onActivate: (subscription: Subscription) => void;
  onCancel: (subscription: Subscription) => Promise<void>;
  onHold: (subscription: Subscription) => Promise<void>;
  onOpenSubscription: (subscriptionId: string) => void;
}

export function SubscriptionsPageContent({
  gridYear,
  onGridYearChange,
  gridPayload,
  gridLoading,
  gridError,
  onGridRetry,
  subscriptions,
  listLoading,
  listError,
  mutationError,
  onDismissMutationError,
  onListRetry,
  activatingId,
  cancellingId,
  holdingId,
  onActivate,
  onCancel,
  onHold,
  onOpenSubscription,
}: SubscriptionsPageContentProps) {
  if (listError) return <ErrorState description={listError} onRetry={onListRetry} />;

  const showEmpty =
    !listLoading &&
    !gridLoading &&
    subscriptions.length === 0 &&
    (!gridPayload || gridPayload.rows.length === 0);

  return (
    <>
      {mutationError ? (
        <ListMutationErrorBanner message={mutationError} onDismiss={onDismissMutationError} />
      ) : null}
      {listLoading && subscriptions.length === 0 ? (
        <LoadingState count={4} />
      ) : showEmpty ? (
        <SubscriptionsEmptyState />
      ) : (
        <SubscriptionCoverageGrid
          year={gridYear}
          onYearChange={onGridYearChange}
          payload={gridPayload}
          subscriptions={subscriptions}
          loading={gridLoading || (listLoading && subscriptions.length === 0)}
          error={gridError}
          onRetry={onGridRetry}
          activatingId={activatingId}
          cancellingId={cancellingId}
          holdingId={holdingId}
          onActivate={onActivate}
          onCancel={onCancel}
          onHold={onHold}
          onOpenSubscription={onOpenSubscription}
        />
      )}
    </>
  );
}

function SubscriptionsEmptyState() {
  return (
    <EmptyState
      icon={RefreshCw}
      title="No subscriptions yet"
      description="Set up recurring billing for your clients"
      action={
        <Button>
          <Plus size={16} />
          Create First Subscription
        </Button>
      }
    />
  );
}
