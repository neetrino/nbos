'use client';

import { Suspense, useMemo, useState, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  IntegratedSearchFilters,
  ListMutationErrorBanner,
  LoadingState,
  useModuleHeroSlots,
} from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { SUBSCRIPTION_TYPES, SUBSCRIPTION_STATUSES } from '@/features/finance/constants/finance';
import { FinanceListPageSettingsSheet } from '@/features/finance/components/FinanceListPageSettingsSheet';
import {
  buildFinancePeriodFilterConfig,
  FINANCE_PERIOD_FILTER_KEY,
  parseFinancePeriodFilterValue,
} from '@/features/finance/constants/finance-period-filter';
import { subscriptionsListPageTitle } from '@/features/finance/constants/finance-route-page-titles';
import { PARTNER_SUBSCRIPTIONS_DRILLDOWN_QUERY } from '@/features/finance/constants/subscription-partner-drilldown';
import { usePartnerFilterOptions } from '@/features/finance/hooks/usePartnerFilterOptions';
import { SubscriptionsPageContent } from '@/features/finance/components/subscriptions/SubscriptionsPageContent';
import { useSubscriptionGrid } from '@/features/finance/components/subscriptions/use-subscription-grid';
import { useSubscriptionsCsvExport } from '@/features/finance/components/subscriptions/use-subscriptions-csv-export';
import { useSubscriptionsScopeStatsCsvExport } from '@/features/finance/components/subscriptions/use-subscriptions-scope-stats-csv-export';
import { useSubscriptionsPageState } from '@/features/finance/components/subscriptions/useSubscriptionsPageState';
import { buildSubscriptionPageQueries } from '@/features/finance/utils/build-subscription-page-queries';
import { useFinanceDocumentTitle } from '@/features/finance/hooks/use-finance-document-title';
import { SubscriptionFormDialog } from '@/features/finance/components/subscriptions/SubscriptionFormDialog';
import { SubscriptionDetailSheet } from '@/features/finance/components/subscriptions/SubscriptionDetailSheet';
import {
  OPEN_SUBSCRIPTION_QUERY,
  subscriptionsListWithOpenSubscriptionHref,
} from '@/features/finance/constants/subscription-deep-link';
import type { Subscription } from '@/lib/api/finance';
import type { FilterConfig } from '@/components/shared/FilterBar';

const SUBSCRIPTION_STATIC_FILTER_CONFIGS: FilterConfig[] = [
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

function SubscriptionsPageInner() {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const partnerIdFromUrl = searchParams.get(PARTNER_SUBSCRIPTIONS_DRILLDOWN_QUERY);
  const openSubscriptionIdFromUrl = searchParams.get(OPEN_SUBSCRIPTION_QUERY)?.trim() || null;

  const page = useSubscriptionsPageState({ partnerIdFromUrl });
  const [gridYear, setGridYear] = useState(() => new Date().getFullYear());
  const subscriptionGrid = useSubscriptionGrid({
    year: gridYear,
    search: page.search,
    filters: page.filtersForBar,
    partnerIdFromUrl: partnerIdFromUrl?.trim() || null,
  });
  const { exportCsvSubmitting, handleExportCsv } = useSubscriptionsCsvExport(
    page.subscriptionListExportParams,
  );
  const { partnerFilterOptions, partnerOptionsLoadError, clearPartnerOptionsLoadError } =
    usePartnerFilterOptions();

  const subscriptionStatsQueryParams = useMemo(() => {
    return buildSubscriptionPageQueries(
      {
        filters: page.filters,
        search: page.search,
        partnerIdFromUrl: partnerIdFromUrl?.trim() || null,
      },
      page.period,
    ).statsParams;
  }, [page.filters, page.period, page.search, partnerIdFromUrl]);

  const { handleExportScopeStatsCsv } = useSubscriptionsScopeStatsCsvExport(page.stats, {
    period: page.period,
    statsQuery: subscriptionStatsQueryParams,
  });

  useFinanceDocumentTitle(subscriptionsListPageTitle(Boolean(partnerIdFromUrl?.trim())));

  const clearPartnerDrilldown = () => {
    router.replace(pathname ?? '/finance/subscriptions');
    page.setFilters((prev) => {
      const next = { ...prev };
      delete next.partner;
      return next;
    });
  };

  const handleFilterChange = useCallback(
    (key: string, value: string) => {
      if (key === FINANCE_PERIOD_FILTER_KEY) {
        page.setPeriod(parseFinancePeriodFilterValue(value));
        return;
      }
      if (partnerIdFromUrl && key === 'partner') {
        router.replace(pathname ?? '/finance/subscriptions');
      }
      page.setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [partnerIdFromUrl, pathname, router, page.setFilters, page.setPeriod],
  );

  const openSubscriptionDetail = useCallback(
    (subscriptionId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(OPEN_SUBSCRIPTION_QUERY, subscriptionId);
      router.push(`${pathname ?? '/finance/subscriptions'}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const handleSubscriptionSheetOpenChange = useCallback(
    (next: boolean) => {
      if (next) return;
      const params = new URLSearchParams(searchParams.toString());
      if (!params.has(OPEN_SUBSCRIPTION_QUERY)) return;
      params.delete(OPEN_SUBSCRIPTION_QUERY);
      const qs = params.toString();
      router.replace(
        qs
          ? `${pathname ?? '/finance/subscriptions'}?${qs}`
          : (pathname ?? '/finance/subscriptions'),
      );
    },
    [pathname, router, searchParams],
  );

  const handleSubscriptionCreated = useCallback(
    (created: Subscription) => {
      void page.fetchSubscriptions();
      subscriptionGrid.retry();
      router.push(subscriptionsListWithOpenSubscriptionHref(created.id));
    },
    [page, router, subscriptionGrid],
  );

  const handleClearFilters = useCallback(() => {
    if (partnerIdFromUrl) {
      router.replace(pathname ?? '/finance/subscriptions');
    }
    page.setFilters({});
    page.setPeriod('month');
    page.setSearch('');
  }, [partnerIdFromUrl, pathname, router, page.setFilters, page.setPeriod, page.setSearch]);

  const filterConfigs = useMemo((): FilterConfig[] => {
    const base = [buildFinancePeriodFilterConfig(), ...SUBSCRIPTION_STATIC_FILTER_CONFIGS];
    if (partnerFilterOptions.length === 0) {
      return base;
    }
    return [
      ...base,
      {
        key: 'partner',
        label: 'Partner',
        options: partnerFilterOptions,
      },
    ];
  }, [partnerFilterOptions]);

  const subscriptionFilterValues = useMemo(
    () => ({
      [FINANCE_PERIOD_FILTER_KEY]: page.period,
      ...page.filtersForBar,
    }),
    [page.filtersForBar, page.period],
  );

  const moduleHeroSlots = useMemo(
    () => ({
      search: (
        <IntegratedSearchFilters
          search={page.search}
          onSearchChange={page.setSearch}
          searchPlaceholder="Search by code, project, company, partner…"
          filters={filterConfigs}
          filterValues={subscriptionFilterValues}
          onFilterChange={handleFilterChange}
          onClearAll={handleClearFilters}
        />
      ),
      trailing: (
        <>
          <FinanceListPageSettingsSheet
            title="Subscriptions — settings"
            description="Exports for the current list scope. Period follows filters in the search bar."
            triggerAriaLabel="Subscriptions settings"
            statsExportDisabled={page.loading || !page.stats}
            exportCsvDisabled={page.loading || exportCsvSubmitting}
            exportCsvInProgress={exportCsvSubmitting}
            onExportScopeStatsCsv={handleExportScopeStatsCsv}
            onExportCsv={handleExportCsv}
            exportCsvLabel="Export subscriptions (CSV)"
          />
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <Plus size={16} aria-hidden />
            New Subscription
          </Button>
        </>
      ),
    }),
    [
      exportCsvSubmitting,
      filterConfigs,
      handleClearFilters,
      handleExportCsv,
      handleExportScopeStatsCsv,
      handleFilterChange,
      page.loading,
      page.search,
      page.setSearch,
      page.stats,
      subscriptionFilterValues,
    ],
  );

  useModuleHeroSlots(moduleHeroSlots);

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
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

      {partnerOptionsLoadError ? (
        <ListMutationErrorBanner
          message={partnerOptionsLoadError}
          onDismiss={clearPartnerOptionsLoadError}
          dismissAriaLabel="Dismiss partner load error"
          dismissText="Dismiss"
        />
      ) : null}

      <SubscriptionFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        onSaved={handleSubscriptionCreated}
      />

      <SubscriptionsPageContent
        gridYear={gridYear}
        onGridYearChange={setGridYear}
        gridPayload={subscriptionGrid.data}
        gridLoading={subscriptionGrid.loading}
        gridError={subscriptionGrid.error}
        onGridRetry={subscriptionGrid.retry}
        subscriptions={page.subscriptions}
        listLoading={page.loading}
        listError={page.error}
        mutationError={page.mutationError}
        onDismissMutationError={page.clearMutationError}
        onListRetry={page.fetchSubscriptions}
        activatingId={page.activatingId}
        cancellingId={page.cancellingId}
        holdingId={page.holdingId}
        onActivate={page.handleActivate}
        onCancel={page.handleCancel}
        onHold={page.handleHold}
        onOpenSubscription={openSubscriptionDetail}
      />

      <SubscriptionDetailSheet
        subscriptionId={openSubscriptionIdFromUrl}
        open={Boolean(openSubscriptionIdFromUrl)}
        onOpenChange={handleSubscriptionSheetOpenChange}
        onSubscriptionUpdated={() => {
          void page.fetchSubscriptions();
          subscriptionGrid.retry();
        }}
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
