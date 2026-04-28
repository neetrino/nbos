'use client';

import { Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FilterBar, LoadingState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { SUBSCRIPTION_TYPES, SUBSCRIPTION_STATUSES } from '@/features/finance/constants/finance';
import { PARTNER_SUBSCRIPTIONS_DRILLDOWN_QUERY } from '@/features/finance/constants/subscription-partner-drilldown';
import { usePartnerFilterOptions } from '@/features/finance/hooks/usePartnerFilterOptions';
import { SubscriptionsPageContent } from '@/features/finance/components/subscriptions/SubscriptionsPageContent';
import { SubscriptionsPageHeader } from '@/features/finance/components/subscriptions/SubscriptionsPageHeader';
import { SubscriptionStatsCards } from '@/features/finance/components/subscriptions/SubscriptionStatsCards';
import { useSubscriptionsPageState } from '@/features/finance/components/subscriptions/useSubscriptionsPageState';

function SubscriptionsPageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const partnerIdFromUrl = searchParams.get(PARTNER_SUBSCRIPTIONS_DRILLDOWN_QUERY);

  const page = useSubscriptionsPageState({ partnerIdFromUrl });
  const { partnerFilterOptions } = usePartnerFilterOptions();

  const totalMRR = Number(page.stats?.monthlyRevenue ?? 0);
  const activeCount = page.subscriptions.filter(
    (subscription) => subscription.status === 'ACTIVE',
  ).length;
  const activeSubscriptions = page.stats?.activeSubscriptions ?? activeCount;

  const clearPartnerDrilldown = () => {
    router.replace(pathname ?? '/finance/subscriptions');
    page.setFilters((prev) => {
      const next = { ...prev };
      delete next.partner;
      return next;
    });
  };

  const handleFilterChange = (key: string, value: string) => {
    if (partnerIdFromUrl && key === 'partner') {
      router.replace(pathname ?? '/finance/subscriptions');
    }
    page.setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    if (partnerIdFromUrl) {
      router.replace(pathname ?? '/finance/subscriptions');
    }
    page.setFilters({});
  };

  const filterConfigs = [
    {
      key: 'type',
      label: 'Type',
      options: SUBSCRIPTION_TYPES.map((t) => ({ value: t.value, label: t.label })),
    },
    {
      key: 'status',
      label: 'Status',
      options: SUBSCRIPTION_STATUSES.map((s) => ({ value: s.value, label: s.label })),
    },
    ...(partnerFilterOptions.length > 0
      ? [
          {
            key: 'partner',
            label: 'Partner',
            options: partnerFilterOptions,
          },
        ]
      : []),
  ];

  return (
    <div className="flex h-full flex-col gap-5">
      <SubscriptionsPageHeader
        activeSubscriptions={activeSubscriptions}
        totalMRR={totalMRR}
        period={page.period}
        onPeriodChange={page.setPeriod}
        onRefresh={page.fetchSubscriptions}
      />

      <SubscriptionStatsCards subscriptions={page.subscriptions} stats={page.stats} />

      {partnerIdFromUrl ? (
        <div className="border-border bg-muted/40 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm">
          <p className="text-foreground max-w-prose">
            Showing subscriptions linked to this partner (server filter).
          </p>
          <Button variant="outline" size="sm" type="button" onClick={clearPartnerDrilldown}>
            Clear filter
          </Button>
        </div>
      ) : null}

      <FilterBar
        search={page.search}
        onSearchChange={page.setSearch}
        searchPlaceholder="Search by project or company..."
        filters={filterConfigs}
        filterValues={page.filtersForBar}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
      />

      <SubscriptionsPageContent
        subscriptions={page.subscriptions}
        loading={page.loading}
        error={page.error}
        activatingId={page.activatingId}
        cancellingId={page.cancellingId}
        holdingId={page.holdingId}
        onRetry={page.fetchSubscriptions}
        onActivate={page.handleActivate}
        onCancel={page.handleCancel}
        onHold={page.handleHold}
        onPartnerLinked={page.handlePartnerLinked}
      />
    </div>
  );
}

export default function SubscriptionsPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <SubscriptionsPageInner />
    </Suspense>
  );
}
