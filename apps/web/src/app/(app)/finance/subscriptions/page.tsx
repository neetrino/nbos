'use client';

import { FilterBar } from '@/components/shared';
import { SUBSCRIPTION_TYPES, SUBSCRIPTION_STATUSES } from '@/features/finance/constants/finance';
import { SubscriptionsPageContent } from '@/features/finance/components/subscriptions/SubscriptionsPageContent';
import { SubscriptionsPageHeader } from '@/features/finance/components/subscriptions/SubscriptionsPageHeader';
import { SubscriptionStatsCards } from '@/features/finance/components/subscriptions/SubscriptionStatsCards';
import { useSubscriptionsPageState } from '@/features/finance/components/subscriptions/useSubscriptionsPageState';

export default function SubscriptionsPage() {
  const page = useSubscriptionsPageState();

  const totalMRR = Number(page.stats?.monthlyRevenue ?? 0);
  const activeCount = page.subscriptions.filter(
    (subscription) => subscription.status === 'ACTIVE',
  ).length;
  const activeSubscriptions = page.stats?.activeSubscriptions ?? activeCount;

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

      <FilterBar
        search={page.search}
        onSearchChange={page.setSearch}
        searchPlaceholder="Search by project or company..."
        filters={filterConfigs}
        filterValues={page.filters}
        onFilterChange={(key, value) => page.setFilters((prev) => ({ ...prev, [key]: value }))}
        onClearFilters={() => page.setFilters({})}
      />

      <SubscriptionsPageContent
        subscriptions={page.subscriptions}
        loading={page.loading}
        error={page.error}
        activatingId={page.activatingId}
        onRetry={page.fetchSubscriptions}
        onActivate={page.handleActivate}
      />
    </div>
  );
}
