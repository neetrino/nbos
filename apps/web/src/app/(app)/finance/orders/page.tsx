'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Download, Loader2, Plus, ShoppingCart, TableProperties, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  EmptyState,
  ErrorState,
  IntegratedSearchFilters,
  ListMutationErrorBanner,
  LoadingState,
  useModuleHeroSlots,
} from '@/components/shared';
import { getFinancePeriodParams, type FinancePeriod } from '@/features/finance/constants/finance';
import {
  ORDER_RECONCILIATION_DRILLDOWN_PAGE_SIZE,
  ORDER_RECONCILIATION_GAP_QUERY,
  parseOrderReconciliationGap,
} from '@/features/finance/constants/order-reconciliation-drilldown';
import { ordersListPageTitle } from '@/features/finance/constants/finance-route-page-titles';
import { PARTNER_ORDERS_DRILLDOWN_QUERY } from '@/features/finance/constants/partner-orders-drilldown';
import { CreateInvoiceDialog } from '@/features/finance/components/invoices/CreateInvoiceDialog';
import { ORDER_STATUSES } from '@/features/finance/components/orders/order-statuses';
import { ReconciliationGapBanner } from '@/features/finance/components/orders/orders-page-helpers';
import { FINANCE_PERIOD_OPTIONS } from '@/features/finance/constants/finance';
import { OrdersTable } from '@/features/finance/components/orders/OrdersTable';
import { useOrdersCsvExport } from '@/features/finance/components/orders/use-orders-csv-export';
import { useOrdersScopeStatsCsvExport } from '@/features/finance/components/orders/use-orders-scope-stats-csv-export';
import { buildOrderListApiParams } from '@/features/finance/utils/build-order-list-api-params';
import { useFinanceDocumentTitle } from '@/features/finance/hooks/use-finance-document-title';
import type { ListData } from '@/lib/api/finance-common';
import {
  ordersApi,
  type Order,
  type OrderListParams,
  type OrderStats,
  type OrderStatsQueryParams,
} from '@/lib/api/finance';
import { getApiErrorMessage } from '@/lib/api-errors';

function OrdersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gap = parseOrderReconciliationGap(searchParams.get(ORDER_RECONCILIATION_GAP_QUERY));
  const partnerIdFromUrl = searchParams.get(PARTNER_ORDERS_DRILLDOWN_QUERY);

  useFinanceDocumentTitle(ordersListPageTitle(Boolean(partnerIdFromUrl?.trim()), gap !== null));

  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [period, setPeriod] = useState<FinancePeriod>('month');
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [listMeta, setListMeta] = useState<ListData<Order>['meta'] | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const orderListExportParams: Omit<OrderListParams, 'page' | 'pageSize'> = useMemo(
    () =>
      buildOrderListApiParams({
        search,
        filters,
        partnerIdFromUrl,
        period,
        gap,
      }),
    [search, filters, partnerIdFromUrl, period, gap],
  );

  const { exportCsvSubmitting, handleExportCsv } = useOrdersCsvExport(orderListExportParams);

  const orderStatsQueryParams = useMemo((): OrderStatsQueryParams => {
    const periodParams = getFinancePeriodParams(period);
    const statusFilter = filters.status && filters.status !== 'all' ? filters.status : undefined;
    return {
      ...periodParams,
      ...(partnerIdFromUrl?.trim() ? { partnerId: partnerIdFromUrl.trim() } : {}),
      ...(gap
        ? {
            gap,
            status: statusFilter,
            search: search.trim() || undefined,
          }
        : {}),
    };
  }, [period, partnerIdFromUrl, gap, filters.status, search]);

  const { handleExportScopeStatsCsv } = useOrdersScopeStatsCsvExport(stats, {
    period,
    statsQuery: orderStatsQueryParams,
  });

  const clearMutationError = useCallback(() => {
    setMutationError(null);
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const pageSize = gap ? ORDER_RECONCILIATION_DRILLDOWN_PAGE_SIZE : 100;
      const listParams: OrderListParams = {
        ...buildOrderListApiParams({
          search,
          filters,
          partnerIdFromUrl,
          period,
          gap,
        }),
        pageSize,
      };
      const [data, orderStats] = await Promise.all([
        ordersApi.getAll(listParams),
        ordersApi.getStats(orderStatsQueryParams),
      ]);
      setOrders(data.items);
      setListMeta(data.meta);
      setStats(orderStats);
      setError(null);
      setMutationError(null);
    } catch (caught) {
      setError(
        getApiErrorMessage(
          caught,
          'Orders could not be loaded. Check your connection and try again.',
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [search, filters, period, gap, partnerIdFromUrl, orderStatsQueryParams]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const refreshOrdersAfterInvoice = useCallback(async () => {
    try {
      await fetchOrders();
    } catch (caught) {
      setMutationError(
        getApiErrorMessage(
          caught,
          'Invoice was created but orders could not be refreshed. Use Refresh.',
        ),
      );
    }
  }, [fetchOrders]);

  const filterConfigs = [
    {
      key: 'status',
      label: 'Status',
      options: Object.entries(ORDER_STATUSES).map(([value, cfg]) => ({
        value,
        label: cfg.label,
      })),
    },
  ];

  const clearReconciliationGap = () => {
    router.replace('/finance/orders');
  };

  const clearPartnerDrilldown = () => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete(PARTNER_ORDERS_DRILLDOWN_QUERY);
    const q = next.toString();
    router.replace(q ? `/finance/orders?${q}` : '/finance/orders');
  };

  const moduleHeroSlots = useMemo(
    () => ({
      search: (
        <IntegratedSearchFilters
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by order, project, product, deal, partner…"
          filters={filterConfigs}
          filterValues={filters}
          onFilterChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
          onClearAll={() => setFilters({})}
        />
      ),
      trailing: (
        <>
          <div className="border-border flex rounded-lg border p-1">
            {FINANCE_PERIOD_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={period === option.value ? 'secondary' : 'ghost'}
                size="sm"
                type="button"
                onClick={() => setPeriod(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={loading || !stats}
            onClick={() => handleExportScopeStatsCsv()}
            aria-label="Export order scope statistics as CSV"
          >
            <TableProperties size={16} aria-hidden />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={loading || exportCsvSubmitting}
            onClick={() => {
              void handleExportCsv();
            }}
            aria-label="Export orders as CSV"
          >
            {exportCsvSubmitting ? (
              <Loader2 size={16} className="animate-spin" aria-hidden />
            ) : (
              <Download size={16} aria-hidden />
            )}
          </Button>
          <Button type="button">
            <Plus size={16} aria-hidden />
            New Order
          </Button>
        </>
      ),
    }),
    [
      exportCsvSubmitting,
      filterConfigs,
      filters,
      handleExportCsv,
      handleExportScopeStatsCsv,
      loading,
      period,
      search,
      stats,
    ],
  );

  useModuleHeroSlots(moduleHeroSlots);

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      {gap ? <ReconciliationGapBanner gap={gap} onClear={clearReconciliationGap} /> : null}

      {partnerIdFromUrl ? (
        <div className="border-border bg-muted/40 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm">
          <p className="text-foreground max-w-prose">
            Showing orders linked to this partner (server filter).
          </p>
          <Button variant="outline" size="sm" type="button" onClick={clearPartnerDrilldown}>
            Clear partner filter
          </Button>
        </div>
      ) : null}

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState description={error} onRetry={fetchOrders} />
      ) : (
        <div className="flex flex-col gap-4">
          {mutationError ? (
            <ListMutationErrorBanner message={mutationError} onDismiss={clearMutationError} />
          ) : null}
          {orders.length === 0 ? (
            partnerIdFromUrl ? (
              <EmptyState
                icon={ShoppingCart}
                title="No orders for this partner"
                description="There are no finance orders linked to this partner in the selected period."
                action={
                  <Button variant="outline" onClick={clearPartnerDrilldown}>
                    <X size={16} />
                    Clear partner filter
                  </Button>
                }
              />
            ) : gap ? (
              <EmptyState
                icon={ShoppingCart}
                title="No orders match this reconciliation filter"
                description="Try clearing the filter or widening the reporting period."
                action={
                  <Button variant="outline" onClick={clearReconciliationGap}>
                    <X size={16} />
                    Clear reconciliation filter
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={ShoppingCart}
                title="No orders yet"
                description="Orders are created from closed deals"
                action={
                  <Button>
                    <Plus size={16} />
                    Create Order
                  </Button>
                }
              />
            )
          ) : (
            <OrdersTable orders={orders} onCreateInvoice={setInvoiceOrder} />
          )}
        </div>
      )}
      <CreateInvoiceDialog
        open={Boolean(invoiceOrder)}
        order={invoiceOrder}
        onOpenChange={(open) => {
          if (!open) setInvoiceOrder(null);
        }}
        onCreated={refreshOrdersAfterInvoice}
      />
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <OrdersPageContent />
    </Suspense>
  );
}
