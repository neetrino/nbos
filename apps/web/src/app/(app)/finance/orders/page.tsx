'use client';

import { Suspense, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import {
  IntegratedSearchFilters,
  LoadingState,
  useModuleHeroSlots,
  ViewModeSwitch,
} from '@/components/shared';
import { Button } from '@/components/ui/button';
import { FinanceListPageSettingsSheet } from '@/features/finance/components/FinanceListPageSettingsSheet';
import { CreateInvoiceDialog } from '@/features/finance/components/invoices/CreateInvoiceDialog';
import { OrderDetailSheet } from '@/features/finance/components/orders/OrderDetailSheet';
import { buildOrderFilterConfigs } from '@/features/finance/components/orders/order-filter-configs';
import { OrdersPageContent } from '@/features/finance/components/orders/OrdersPageContent';
import { ORDER_VIEW_OPTIONS } from '@/features/finance/components/orders/order-view-options';
import { ORDER_BOARD_STAGES } from '@/features/finance/constants/order-board-lifecycle';
import {
  DEFAULT_BOARD_LIFECYCLE_SCOPE,
  matchesBoardLifecycleScope,
  resolveBoardLifecycleScope,
  type BoardLifecycleScope,
} from '@/features/shared/board-lifecycle';
import { useOrdersCsvExport } from '@/features/finance/components/orders/use-orders-csv-export';
import { useOrdersPageState } from '@/features/finance/components/orders/useOrdersPageState';
import { useOrdersScopeStatsCsvExport } from '@/features/finance/components/orders/use-orders-scope-stats-csv-export';
import { OPEN_ORDER_QUERY } from '@/features/finance/constants/order-deep-link';
import {
  ORDER_RECONCILIATION_GAP_QUERY,
  parseOrderReconciliationGap,
} from '@/features/finance/constants/order-reconciliation-drilldown';
import { ordersListPageTitle } from '@/features/finance/constants/finance-route-page-titles';
import { PARTNER_ORDERS_DRILLDOWN_QUERY } from '@/features/finance/constants/partner-orders-drilldown';
import {
  FINANCE_PERIOD_FILTER_KEY,
  FINANCE_DEFAULT_LIST_PERIOD,
  parseFinancePeriodFilterValue,
} from '@/features/finance/constants/finance-period-filter';
import { useFinanceDocumentTitle } from '@/features/finance/hooks/use-finance-document-title';

function OrdersPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gap = parseOrderReconciliationGap(searchParams.get(ORDER_RECONCILIATION_GAP_QUERY));
  const partnerIdFromUrl = searchParams.get(PARTNER_ORDERS_DRILLDOWN_QUERY);
  const openOrderIdFromUrl = searchParams.get(OPEN_ORDER_QUERY)?.trim() || null;

  useFinanceDocumentTitle(ordersListPageTitle(Boolean(partnerIdFromUrl?.trim()), gap !== null));

  const state = useOrdersPageState({
    gap,
    partnerIdFromUrl,
    openOrderIdFromUrl,
  });

  const { exportCsvSubmitting, handleExportCsv } = useOrdersCsvExport(state.orderListExportParams);
  const { handleExportScopeStatsCsv } = useOrdersScopeStatsCsvExport(state.stats, {
    period: state.period,
    statsQuery: state.orderStatsQueryParams,
  });

  const boardScope = resolveBoardLifecycleScope(state.filters.boardScope);
  const hasOrderStatusFilter = Boolean(state.filters.status) && state.filters.status !== 'all';

  const displayOrders = useMemo(() => {
    if (hasOrderStatusFilter) return state.orders;
    return state.orders.filter((order) =>
      matchesBoardLifecycleScope(order.status, ORDER_BOARD_STAGES, boardScope),
    );
  }, [state.orders, boardScope, hasOrderStatusFilter]);

  const orderFilterConfigs = useMemo(() => buildOrderFilterConfigs(), []);

  const orderFilterValues = useMemo(
    () => ({
      [FINANCE_PERIOD_FILTER_KEY]: state.period,
      boardScope: state.filters.boardScope ?? DEFAULT_BOARD_LIFECYCLE_SCOPE,
      ...state.filters,
    }),
    [state.filters, state.period],
  );

  const handleOrderFilterChange = useCallback(
    (key: string, value: string) => {
      if (key === FINANCE_PERIOD_FILTER_KEY) {
        state.setPeriod(parseFinancePeriodFilterValue(value));
        return;
      }
      state.setFilters((prev) => {
        if (key === 'boardScope' && value === DEFAULT_BOARD_LIFECYCLE_SCOPE) {
          const next = { ...prev };
          delete next.boardScope;
          return next;
        }
        return { ...prev, [key]: value };
      });
    },
    [state],
  );

  const handleClearOrderFilters = useCallback(() => {
    state.setFilters({});
    state.setPeriod(FINANCE_DEFAULT_LIST_PERIOD);
  }, [state]);

  const clearReconciliationGap = useCallback(() => {
    router.replace('/finance/orders');
  }, [router]);

  const clearPartnerDrilldown = useCallback(() => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete(PARTNER_ORDERS_DRILLDOWN_QUERY);
    const q = next.toString();
    router.replace(q ? `/finance/orders?${q}` : '/finance/orders');
  }, [router, searchParams]);

  const moduleHeroSlots = useMemo(
    () => ({
      search: (
        <IntegratedSearchFilters
          search={state.search}
          onSearchChange={state.setSearch}
          searchPlaceholder="Search by order, project, product, deal, partner…"
          filters={orderFilterConfigs}
          filterValues={orderFilterValues}
          onFilterChange={handleOrderFilterChange}
          onClearAll={handleClearOrderFilters}
        />
      ),
      viewMode: (
        <ViewModeSwitch value={state.view} onChange={state.setView} options={ORDER_VIEW_OPTIONS} />
      ),
      trailing: (
        <>
          <FinanceListPageSettingsSheet
            title="Orders — settings"
            description="Exports for the current list scope. Period and status follow filters in the search bar."
            triggerAriaLabel="Orders settings"
            statsExportDisabled={state.loading || !state.stats}
            exportCsvDisabled={state.loading || exportCsvSubmitting}
            exportCsvInProgress={exportCsvSubmitting}
            onExportScopeStatsCsv={handleExportScopeStatsCsv}
            onExportCsv={handleExportCsv}
            exportCsvLabel="Export orders (CSV)"
          />
          <Button type="button" disabled>
            <Plus size={16} aria-hidden />
            New Order
          </Button>
        </>
      ),
    }),
    [
      exportCsvSubmitting,
      handleClearOrderFilters,
      handleExportCsv,
      handleExportScopeStatsCsv,
      handleOrderFilterChange,
      orderFilterConfigs,
      state,
    ],
  );

  useModuleHeroSlots(moduleHeroSlots);

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <div className="flex min-h-0 flex-1 flex-col">
        <OrdersPageContent
          orders={displayOrders}
          boardScope={boardScope as BoardLifecycleScope}
          view={state.view}
          loading={state.loading}
          error={state.error}
          mutationError={state.mutationError}
          onDismissMutationError={state.clearMutationError}
          onRetry={state.fetchOrders}
          gap={gap}
          partnerIdFromUrl={partnerIdFromUrl}
          onClearReconciliationGap={clearReconciliationGap}
          onClearPartnerDrilldown={clearPartnerDrilldown}
          onOrderClick={state.handleOrderClick}
          onCreateInvoice={state.handleCreateInvoice}
        />
      </div>
      <OrderDetailSheet
        orderId={state.selectedOrder?.id ?? openOrderIdFromUrl}
        open={state.sheetOpen}
        onOpenChange={state.handleOrderSheetOpenChange}
        onCreateInvoice={state.handleCreateInvoice}
        refreshSignal={state.sheetRefreshKey}
      />
      <CreateInvoiceDialog
        open={Boolean(state.invoiceOrder)}
        order={state.invoiceOrder}
        onOpenChange={state.handleInvoiceDialogOpenChange}
        onCreated={state.refreshOrdersAfterInvoice}
      />
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <OrdersPageInner />
    </Suspense>
  );
}
