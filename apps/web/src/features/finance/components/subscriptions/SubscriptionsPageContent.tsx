import { Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared';
import type { Subscription } from '@/lib/api/finance';
import { SubscriptionCoverageGrid } from './SubscriptionCoverageGrid';
import { SubscriptionsTable } from './SubscriptionsTable';

interface SubscriptionsPageContentProps {
  subscriptions: Subscription[];
  loading: boolean;
  error: string | null;
  activatingId: string | null;
  onRetry: () => void;
  onActivate: (subscription: Subscription) => void;
}

export function SubscriptionsPageContent({
  subscriptions,
  loading,
  error,
  activatingId,
  onRetry,
  onActivate,
}: SubscriptionsPageContentProps) {
  if (loading) return <LoadingState count={4} />;
  if (error) return <ErrorState description={error} onRetry={onRetry} />;
  if (subscriptions.length === 0) return <SubscriptionsEmptyState />;

  return (
    <>
      <SubscriptionCoverageGrid subscriptions={subscriptions} />
      <SubscriptionsTable
        subscriptions={subscriptions}
        activatingId={activatingId}
        onActivate={onActivate}
      />
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
