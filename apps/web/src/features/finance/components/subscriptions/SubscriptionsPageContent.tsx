import { Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, ListMutationErrorBanner, LoadingState } from '@/components/shared';
import type { Subscription, SubscriptionGridPayload } from '@/lib/api/finance';
import { SubscriptionCoverageGrid } from './SubscriptionCoverageGrid';
import { SubscriptionsTable } from './SubscriptionsTable';

interface SubscriptionsPageContentProps {
  gridYear: number;
  onGridYearChange: (year: number) => void;
  gridPayload: SubscriptionGridPayload | null;
  gridLoading: boolean;
  gridError: string | null;
  onGridRetry: () => void;
  subscriptions: Subscription[];
  loading: boolean;
  error: string | null;
  mutationError: string | null;
  onDismissMutationError: () => void;
  activatingId: string | null;
  cancellingId: string | null;
  holdingId: string | null;
  onRetry: () => void;
  onActivate: (subscription: Subscription) => void;
  onCancel: (subscription: Subscription) => Promise<void>;
  onHold: (subscription: Subscription) => Promise<void>;
  onPartnerLinked: (subscription: Subscription) => void;
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
  loading,
  error,
  mutationError,
  onDismissMutationError,
  activatingId,
  cancellingId,
  holdingId,
  onRetry,
  onActivate,
  onCancel,
  onHold,
  onPartnerLinked,
  onOpenSubscription,
}: SubscriptionsPageContentProps) {
  if (loading) return <LoadingState count={4} />;
  if (error) return <ErrorState description={error} onRetry={onRetry} />;

  return (
    <>
      {mutationError ? (
        <ListMutationErrorBanner message={mutationError} onDismiss={onDismissMutationError} />
      ) : null}
      <SubscriptionCoverageGrid
        year={gridYear}
        onYearChange={onGridYearChange}
        payload={gridPayload}
        loading={gridLoading}
        error={gridError}
        onRetry={onGridRetry}
        onOpenSubscription={onOpenSubscription}
      />
      {subscriptions.length === 0 ? (
        <SubscriptionsEmptyState />
      ) : (
        <SubscriptionsTable
          subscriptions={subscriptions}
          activatingId={activatingId}
          cancellingId={cancellingId}
          holdingId={holdingId}
          onActivate={onActivate}
          onCancel={onCancel}
          onHold={onHold}
          onPartnerLinked={onPartnerLinked}
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
