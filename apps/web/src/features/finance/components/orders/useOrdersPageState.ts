import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  ORDER_RECONCILIATION_DRILLDOWN_PAGE_SIZE,
  parseOrderReconciliationGap,
} from '@/features/finance/constants/order-reconciliation-drilldown';
import { OPEN_ORDER_QUERY } from '@/features/finance/constants/order-deep-link';
import { getFinancePeriodParams, type FinancePeriod } from '@/features/finance/constants/finance';
import { FINANCE_DEFAULT_LIST_PERIOD } from '@/features/finance/constants/finance-period-filter';
import { buildOrderListApiParams } from '@/features/finance/utils/build-order-list-api-params';
import {
  readOrdersBoardViewMode,
  writeOrdersBoardViewMode,
} from '@/features/finance/constants/orders-board-view';
import type { OrderViewMode } from '@/features/finance/components/orders/order-page-types';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  ordersApi,
  type Order,
  type OrderListParams,
  type OrderStats,
  type OrderStatsQueryParams,
} from '@/lib/api/finance';

interface UseOrdersPageStateOptions {
  gap: ReturnType<typeof parseOrderReconciliationGap>;
  partnerIdFromUrl: string | null;
  openOrderIdFromUrl: string | null;
}

export function useOrdersPageState({
  gap,
  partnerIdFromUrl,
  openOrderIdFromUrl,
}: UseOrdersPageStateOptions) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [period, setPeriod] = useState<FinancePeriod>(FINANCE_DEFAULT_LIST_PERIOD);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [sheetRefreshKey, setSheetRefreshKey] = useState(0);
  const [view, setViewState] = useState<OrderViewMode>(() => readOrdersBoardViewMode());
  const setView = useCallback((next: OrderViewMode) => {
    setViewState(next);
    writeOrdersBoardViewMode(next);
  }, []);

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

  const clearMutationError = useCallback(() => {
    setMutationError(null);
  }, []);

  const stripOpenOrderFromUrl = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (!params.has(OPEN_ORDER_QUERY)) return;
    params.delete(OPEN_ORDER_QUERY);
    const q = params.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const pushOpenOrderToUrl = useCallback(
    (orderId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(OPEN_ORDER_QUERY, orderId);
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

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
    void fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (!openOrderIdFromUrl) return;
    let cancelled = false;
    void (async () => {
      try {
        const order = await ordersApi.getById(openOrderIdFromUrl);
        if (!cancelled) {
          setSelectedOrder(order);
          setSheetOpen(true);
        }
      } catch (caught) {
        toast.error(getApiErrorMessage(caught, 'Could not open order from link.'));
        stripOpenOrderFromUrl();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [openOrderIdFromUrl, stripOpenOrderFromUrl]);

  const refreshOrdersAfterInvoice = useCallback(async () => {
    try {
      await fetchOrders();
      setSheetRefreshKey((key) => key + 1);
    } catch (caught) {
      setMutationError(
        getApiErrorMessage(
          caught,
          'Invoice was created but orders could not be refreshed. Use Refresh.',
        ),
      );
    }
  }, [fetchOrders]);

  const handleOrderClick = useCallback(
    (order: Order) => {
      setSelectedOrder(order);
      setSheetOpen(true);
      pushOpenOrderToUrl(order.id);
    },
    [pushOpenOrderToUrl],
  );

  const handleOrderSheetOpenChange = useCallback(
    (open: boolean) => {
      setSheetOpen(open);
      if (!open) {
        setSelectedOrder(null);
        stripOpenOrderFromUrl();
      }
    },
    [stripOpenOrderFromUrl],
  );

  const handleCreateInvoice = useCallback((order: Order) => {
    setInvoiceOrder(order);
  }, []);

  const handleInvoiceDialogOpenChange = useCallback((open: boolean) => {
    if (!open) setInvoiceOrder(null);
  }, []);

  return {
    orders,
    stats,
    loading,
    error,
    mutationError,
    clearMutationError,
    search,
    setSearch,
    filters,
    setFilters,
    setPeriod,
    period,
    fetchOrders,
    orderListExportParams,
    orderStatsQueryParams,
    selectedOrder,
    sheetOpen,
    handleOrderClick,
    handleOrderSheetOpenChange,
    invoiceOrder,
    handleCreateInvoice,
    handleInvoiceDialogOpenChange,
    refreshOrdersAfterInvoice,
    sheetRefreshKey,
    view,
    setView,
  };
}
