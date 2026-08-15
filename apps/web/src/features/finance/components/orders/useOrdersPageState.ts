import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from '@/components/shared';
import {
  ORDER_RECONCILIATION_DRILLDOWN_PAGE_SIZE,
  parseOrderReconciliationGap,
} from '@/features/finance/constants/order-reconciliation-drilldown';
import { OPEN_ORDER_QUERY } from '@/features/finance/constants/order-deep-link';
import { getFinancePeriodParams, type FinancePeriod } from '@/features/finance/constants/finance';
import { FINANCE_DEFAULT_LIST_PERIOD } from '@/features/finance/constants/finance-period-filter';
import { ORDER_BOARD_STAGES } from '@/features/finance/constants/order-board-lifecycle';
import { buildOrderListApiParams } from '@/features/finance/utils/build-order-list-api-params';
import { useOrdersBoardViewMode } from '@/features/finance/constants/orders-board-view';
import { getBoardStageKeys, resolveBoardLifecycleScope } from '@/features/shared/board-lifecycle';
import { useStageColumnBoard } from '@/features/shared/kanban/use-stage-column-board';
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

  const [gapOrders, setGapOrders] = useState<Order[]>([]);
  const [gapLoading, setGapLoading] = useState(false);
  const [gapError, setGapError] = useState<string | null>(null);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS).trim();
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [period, setPeriod] = useState<FinancePeriod>(FINANCE_DEFAULT_LIST_PERIOD);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [sheetRefreshKey, setSheetRefreshKey] = useState(0);
  const [view, setView] = useOrdersBoardViewMode();

  const boardScope = resolveBoardLifecycleScope(filters.boardScope);
  const stageKeys = useMemo(() => {
    if (filters.status && filters.status !== 'all') return [filters.status];
    return getBoardStageKeys(ORDER_BOARD_STAGES, boardScope);
  }, [boardScope, filters.status]);

  const listFilterBase = useMemo(
    () =>
      buildOrderListApiParams({
        search: debouncedSearch,
        filters: { ...filters, status: 'all' },
        partnerIdFromUrl,
        period,
        gap: null,
      }),
    [debouncedSearch, filters, partnerIdFromUrl, period],
  );

  const fetchOrderPage = useCallback(
    (params: { page: number; pageSize: number; status: string }) =>
      ordersApi.getAll({
        ...listFilterBase,
        status: params.status,
        page: params.page,
        pageSize: params.pageSize,
      }),
    [listFilterBase],
  );

  const board = useStageColumnBoard<Order>({
    stageKeys,
    enabled: !gap,
    getStageKey: (order) => order.status,
    fetchPage: fetchOrderPage,
    loadErrorMessage: 'Orders could not be loaded. Check your connection and try again.',
  });

  const {
    items: boardItems,
    columnMeta,
    hasMoreAny,
    loading: boardLoading,
    error: boardError,
    reload: reloadBoard,
    loadMoreColumn,
    loadMoreAll,
    upsertItem,
  } = board;

  const orderListExportParams: Omit<OrderListParams, 'page' | 'pageSize'> = useMemo(
    () =>
      buildOrderListApiParams({
        search: debouncedSearch,
        filters,
        partnerIdFromUrl,
        period,
        gap,
      }),
    [debouncedSearch, filters, partnerIdFromUrl, period, gap],
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
            search: debouncedSearch || undefined,
          }
        : {}),
    };
  }, [period, partnerIdFromUrl, gap, filters.status, debouncedSearch]);

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

  const fetchGapOrders = useCallback(async () => {
    if (!gap) return;
    setGapLoading(true);
    try {
      const listParams: OrderListParams = {
        ...buildOrderListApiParams({
          search: debouncedSearch,
          filters,
          partnerIdFromUrl,
          period,
          gap,
        }),
        pageSize: ORDER_RECONCILIATION_DRILLDOWN_PAGE_SIZE,
      };
      const [data, orderStats] = await Promise.all([
        ordersApi.getAll(listParams),
        ordersApi.getStats(orderStatsQueryParams),
      ]);
      setGapOrders(data.items);
      setStats(orderStats);
      setGapError(null);
      setMutationError(null);
    } catch (caught) {
      setGapError(
        getApiErrorMessage(
          caught,
          'Orders could not be loaded. Check your connection and try again.',
        ),
      );
    } finally {
      setGapLoading(false);
    }
  }, [debouncedSearch, filters, period, gap, partnerIdFromUrl, orderStatsQueryParams]);

  const fetchStats = useCallback(async () => {
    try {
      setStats(await ordersApi.getStats(orderStatsQueryParams));
    } catch {
      setStats(null);
    }
  }, [orderStatsQueryParams]);

  useEffect(() => {
    if (gap) {
      let cancelled = false;
      void (async () => {
        await fetchGapOrders();
        if (cancelled) return;
      })();
      return () => {
        cancelled = true;
      };
    }
    let cancelled = false;
    void (async () => {
      try {
        const next = await ordersApi.getStats(orderStatsQueryParams);
        if (!cancelled) setStats(next);
      } catch {
        if (!cancelled) setStats(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [gap, fetchGapOrders, orderStatsQueryParams]);

  const orders = gap ? gapOrders : boardItems;
  const loading = gap ? gapLoading : boardLoading;
  const error = gap ? gapError : boardError;

  const fetchOrders = useCallback(async () => {
    if (gap) {
      await fetchGapOrders();
      return;
    }
    await reloadBoard();
    await fetchStats();
  }, [gap, fetchGapOrders, reloadBoard, fetchStats]);

  useEffect(() => {
    if (!openOrderIdFromUrl) return;
    const fromList = orders.find((row) => row.id === openOrderIdFromUrl);
    if (fromList) {
      setSelectedOrder(fromList);
      setSheetOpen(true);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const order = await ordersApi.getById(openOrderIdFromUrl);
        if (!cancelled) {
          setSelectedOrder(order);
          setSheetOpen(true);
          if (!gap) upsertItem(order);
        }
      } catch (caught) {
        toast.error(getApiErrorMessage(caught, 'Could not open order from link.'));
        stripOpenOrderFromUrl();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [openOrderIdFromUrl, orders, stripOpenOrderFromUrl, gap, upsertItem]);

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
    boardScope,
    columnMeta: gap ? undefined : columnMeta,
    hasMoreAny: gap ? false : hasMoreAny,
    loadMoreColumn,
    loadMoreAll,
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
