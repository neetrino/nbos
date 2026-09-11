'use client';

import { Button } from '@/components/ui/button';
import { useIsMobileViewport } from '@/hooks/use-is-mobile-viewport';
import type { Subscription, SubscriptionGridPayload } from '@/lib/api/finance';
import { SubscriptionCoverageDesktopGrid } from './SubscriptionCoverageDesktopGrid';
import { SubscriptionCoverageMobileBoard } from './SubscriptionCoverageMobileBoard';

interface SubscriptionCoverageGridProps {
  year: number;
  onYearChange: (year: number) => void;
  payload: SubscriptionGridPayload | null;
  subscriptions: Subscription[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onOpenSubscription: (subscriptionId: string) => void;
  onOpenMonthCell: (args: { subscriptionId: string; invoiceId: string | null }) => void;
}

export function SubscriptionCoverageGrid({
  year,
  onYearChange,
  payload,
  subscriptions,
  loading,
  error,
  onRetry,
  onOpenSubscription,
  onOpenMonthCell,
}: SubscriptionCoverageGridProps) {
  const isMobileViewport = useIsMobileViewport();

  if (error) {
    return (
      <div className="border-border bg-destructive/10 flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm">
        <span>{error}</span>
        <Button type="button" variant="outline" size="sm" onClick={() => void onRetry()}>
          Retry
        </Button>
      </div>
    );
  }

  if (loading) {
    return <div className="border-border bg-muted/30 h-40 animate-pulse rounded-xl border" />;
  }

  if (!payload || payload.rows.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No subscription rows for this year with the current filters.
      </p>
    );
  }

  const viewProps = {
    year,
    onYearChange,
    payload,
    subscriptions,
    onOpenSubscription,
    onOpenMonthCell,
  };

  if (isMobileViewport) {
    return <SubscriptionCoverageMobileBoard {...viewProps} />;
  }

  return <SubscriptionCoverageDesktopGrid {...viewProps} />;
}
