import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { getFinancePeriodParams, type FinancePeriod } from '@/features/finance/constants/finance';
import { FINANCE_DEFAULT_LIST_PERIOD } from '@/features/finance/constants/finance-period-filter';
import { OPEN_INVOICE_QUERY } from '@/features/finance/constants/invoice-deep-link';
import { PORTFOLIO_DEEP_LINK } from '@/features/clients/constants/client-portfolio-deep-links';
import { INVOICE_MONEY_BOARD_STAGES } from '@/features/finance/constants/invoice-board-lifecycle';
import { buildInvoiceListApiParams } from '@/features/finance/utils/build-invoice-list-api-params';
import {
  getLocalInvoiceMoneyStatusGateErrors,
  mapInvoiceMoneyStatusApiMessage,
} from '@/features/finance/constants/invoice-money-status-gate-client';
import type { InvoiceSheetStageGateHighlight } from '@/features/finance/constants/invoice-stage-gate-highlight';
import { getBoardStageKeys, resolveBoardLifecycleScope } from '@/features/shared/board-lifecycle';
import { useStageColumnBoard } from '@/features/shared/kanban/use-stage-column-board';
import { ApiError, getApiErrorMessage, isStageGateApiError } from '@/lib/api-errors';
import {
  invoicesApi,
  paymentsApi,
  type Invoice,
  type InvoiceListParams,
  type InvoiceStats,
} from '@/lib/api/finance';
import { useInvoicesBoardViewMode } from '@/features/finance/constants/invoices-board-view';

interface RecordPaymentInput {
  invoiceId: string;
  amount: number;
  paymentDate: string;
  paymentMethod?: string;
  notes?: string;
}

interface UseInvoicesPageStateOptions {
  subscriptionIdFromUrl?: string | null;
  openInvoiceIdFromUrl?: string | null;
  portfolioCreateInvoiceFromUrl?: boolean;
  portfolioProjectIdFromUrl?: string | null;
}

export function useInvoicesPageState(options?: UseInvoicesPageStateOptions) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const subscriptionIdFromUrl = options?.subscriptionIdFromUrl?.trim() || null;
  const openInvoiceIdFromUrl = options?.openInvoiceIdFromUrl?.trim() || null;
  const portfolioCreateInvoiceFromUrl = options?.portfolioCreateInvoiceFromUrl === true;
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [view, setView] = useInvoicesBoardViewMode();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [stageGateHighlight, setStageGateHighlight] =
    useState<InvoiceSheetStageGateHighlight | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [period, setPeriod] = useState<FinancePeriod>(FINANCE_DEFAULT_LIST_PERIOD);

  const boardScope = resolveBoardLifecycleScope(filters.boardScope);
  const stageKeys = useMemo(() => {
    if (filters.moneyStatus && filters.moneyStatus !== 'all') return [filters.moneyStatus];
    return getBoardStageKeys(INVOICE_MONEY_BOARD_STAGES, boardScope);
  }, [boardScope, filters.moneyStatus]);

  const listFilterBase = useMemo(
    () =>
      buildInvoiceListApiParams({
        search,
        filters: { ...filters, moneyStatus: 'all' },
        subscriptionIdFromUrl,
        period,
      }),
    [search, filters, subscriptionIdFromUrl, period],
  );

  const fetchInvoicePage = useCallback(
    (params: { page: number; pageSize: number; status: string }) =>
      invoicesApi.getAll({
        ...listFilterBase,
        moneyStatus: params.status,
        page: params.page,
        pageSize: params.pageSize,
      }),
    [listFilterBase],
  );

  const board = useStageColumnBoard<Invoice>({
    stageKeys,
    getStageKey: (invoice) => invoice.moneyStatus,
    fetchPage: fetchInvoicePage,
    loadErrorMessage: 'Invoices could not be loaded. Check your connection and try again.',
  });

  const {
    items: invoices,
    columnMeta,
    hasMoreAny,
    loading,
    error,
    reload,
    loadMoreColumn,
    loadMoreAll,
    setItems,
    upsertItem,
    removeItem,
  } = board;

  const invoiceListExportParams: Omit<InvoiceListParams, 'page' | 'pageSize'> = useMemo(
    () =>
      buildInvoiceListApiParams({
        search,
        filters,
        subscriptionIdFromUrl,
        period,
      }),
    [search, filters, subscriptionIdFromUrl, period],
  );

  const clearMutationError = useCallback(() => {
    setMutationError(null);
  }, []);

  const stripOpenInvoiceFromUrl = useCallback(() => {
    const p = new URLSearchParams(searchParams.toString());
    if (!p.has(OPEN_INVOICE_QUERY)) return;
    p.delete(OPEN_INVOICE_QUERY);
    const q = p.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const fetchStats = useCallback(async () => {
    try {
      const periodParams = getFinancePeriodParams(period);
      setStats(
        await invoicesApi.getStats({
          ...periodParams,
          ...(subscriptionIdFromUrl ? { subscriptionId: subscriptionIdFromUrl } : {}),
        }),
      );
    } catch {
      setStats(null);
    }
  }, [period, subscriptionIdFromUrl]);

  const fetchInvoices = useCallback(async () => {
    await reload();
    await fetchStats();
    setMutationError(null);
  }, [reload, fetchStats]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const periodParams = getFinancePeriodParams(period);
        const next = await invoicesApi.getStats({
          ...periodParams,
          ...(subscriptionIdFromUrl ? { subscriptionId: subscriptionIdFromUrl } : {}),
        });
        if (!cancelled) setStats(next);
      } catch {
        if (!cancelled) setStats(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [period, subscriptionIdFromUrl]);

  const pushOpenInvoiceToUrl = useCallback(
    (invoiceId: string) => {
      const p = new URLSearchParams(searchParams.toString());
      p.set(OPEN_INVOICE_QUERY, invoiceId);
      router.push(`${pathname}?${p.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const showInvoiceStageGateRequirements = useCallback(
    (invoice: Invoice, errors: InvoiceSheetStageGateHighlight['errors']) => {
      setStageGateHighlight({ errors });
      setSelectedInvoice(invoice);
      setSheetOpen(true);
      pushOpenInvoiceToUrl(invoice.id);
    },
    [pushOpenInvoiceToUrl],
  );

  const handleMoneyStatusChange = useInvoiceMoneyStatusChange({
    invoices,
    setItems,
    selectedInvoice,
    setSelectedInvoice,
    showInvoiceStageGateRequirements,
    onTransitionSuccess: () => setStageGateHighlight(null),
  });
  const handlePaymentRecorded = usePaymentRecorder(
    fetchInvoices,
    setSelectedInvoice,
    setMutationError,
  );

  useEffect(() => {
    if (!openInvoiceIdFromUrl) return;
    const fromList = invoices.find((row) => row.id === openInvoiceIdFromUrl);
    if (fromList) {
      queueMicrotask(() => {
        setSelectedInvoice(fromList);
        setSheetOpen(true);
      });
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const inv = await invoicesApi.getById(openInvoiceIdFromUrl);
        if (!cancelled) {
          setSelectedInvoice(inv);
          setSheetOpen(true);
          upsertItem(inv);
        }
      } catch (caught) {
        toast.error(getApiErrorMessage(caught, 'Could not open invoice from link.'));
        stripOpenInvoiceFromUrl();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [openInvoiceIdFromUrl, invoices, stripOpenInvoiceFromUrl, upsertItem]);

  const createDialogOpen = createOpen || portfolioCreateInvoiceFromUrl;

  const stripPortfolioCreateFromUrl = useCallback(() => {
    const p = new URLSearchParams(searchParams.toString());
    const had = p.has(PORTFOLIO_DEEP_LINK.createInvoice) || p.has(PORTFOLIO_DEEP_LINK.projectId);
    if (!had) return;
    p.delete(PORTFOLIO_DEEP_LINK.createInvoice);
    p.delete(PORTFOLIO_DEEP_LINK.projectId);
    const q = p.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const handleCreateDialogOpenChange = useCallback(
    (open: boolean) => {
      setCreateOpen(open);
      if (!open) stripPortfolioCreateFromUrl();
    },
    [stripPortfolioCreateFromUrl],
  );

  const handleInvoiceSheetOpenChange = useCallback(
    (open: boolean) => {
      setSheetOpen(open);
      if (!open) {
        setSelectedInvoice(null);
        setStageGateHighlight(null);
        stripOpenInvoiceFromUrl();
      }
    },
    [stripOpenInvoiceFromUrl],
  );

  const handleInvoiceClick = useCallback(
    (invoice: Invoice) => {
      setStageGateHighlight(null);
      setSelectedInvoice(invoice);
      setSheetOpen(true);
      pushOpenInvoiceToUrl(invoice.id);
    },
    [pushOpenInvoiceToUrl],
  );

  const handleInvoiceUpdated = useCallback(
    (updated: Invoice) => {
      setSelectedInvoice(updated);
      upsertItem(updated);
    },
    [upsertItem],
  );

  const handleInvoiceDeleted = useCallback(
    (invoiceId: string) => {
      setSelectedInvoice(null);
      setSheetOpen(false);
      setStageGateHighlight(null);
      removeItem(invoiceId);
      stripOpenInvoiceFromUrl();
    },
    [removeItem, stripOpenInvoiceFromUrl],
  );

  const handleInvoiceCreated = useCallback(
    async (created?: Invoice) => {
      await fetchInvoices();
      setStageGateHighlight(null);
      if (!created) return;
      setSelectedInvoice(created);
      setSheetOpen(true);
      pushOpenInvoiceToUrl(created.id);
    },
    [fetchInvoices, pushOpenInvoiceToUrl],
  );

  return {
    invoices,
    columnMeta,
    hasMoreAny,
    loadMoreColumn,
    loadMoreAll,
    boardScope,
    stats,
    loading,
    error,
    mutationError,
    clearMutationError,
    search,
    setSearch,
    filters,
    setFilters,
    view,
    setView,
    selectedInvoice,
    sheetOpen,
    setSheetOpen,
    handleInvoiceSheetOpenChange,
    createDialogOpen,
    handleCreateDialogOpenChange,
    createOpen,
    setCreateOpen,
    period,
    setPeriod,
    fetchInvoices,
    handleInvoiceClick,
    handleMoneyStatusChange,
    handlePaymentRecorded,
    handleInvoiceUpdated,
    handleInvoiceDeleted,
    handleInvoiceCreated,
    invoiceListExportParams,
    stageGateHighlight,
  };
}

function useInvoiceMoneyStatusChange({
  invoices,
  setItems,
  selectedInvoice,
  setSelectedInvoice,
  showInvoiceStageGateRequirements,
  onTransitionSuccess,
}: {
  invoices: Invoice[];
  setItems: (updater: (prev: Invoice[]) => Invoice[]) => void;
  selectedInvoice: Invoice | null;
  setSelectedInvoice: (invoice: Invoice | null) => void;
  showInvoiceStageGateRequirements: (
    invoice: Invoice,
    errors: InvoiceSheetStageGateHighlight['errors'],
  ) => void;
  onTransitionSuccess: () => void;
}) {
  return useCallback(
    async (id: string, moneyStatus: string) => {
      const currentInvoice = invoices.find((invoice) => invoice.id === id);
      if (currentInvoice) {
        const localErrors = getLocalInvoiceMoneyStatusGateErrors(currentInvoice, moneyStatus);
        if (localErrors.length > 0) {
          showInvoiceStageGateRequirements(currentInvoice, localErrors);
          return;
        }
      }

      const previousInvoices = invoices;
      const previousSelected = selectedInvoice;
      setItems((current) =>
        current.map((invoice) => (invoice.id === id ? { ...invoice, moneyStatus } : invoice)),
      );
      if (selectedInvoice?.id === id) {
        setSelectedInvoice({ ...selectedInvoice, moneyStatus });
      }

      try {
        const updated = await invoicesApi.updateMoneyStatus(id, moneyStatus);
        setItems((current) => replaceInvoice(current, updated));
        if (selectedInvoice?.id === id) {
          setSelectedInvoice(updated);
        }
        onTransitionSuccess();
      } catch (caught) {
        setItems(() => previousInvoices);
        if (previousSelected?.id === id) {
          setSelectedInvoice(previousSelected);
        }
        const blockedInvoice =
          previousInvoices.find((invoice) => invoice.id === id) ?? previousSelected;
        if (isStageGateApiError(caught) && blockedInvoice) {
          showInvoiceStageGateRequirements(blockedInvoice, caught.errors);
          return;
        }
        if (caught instanceof ApiError && blockedInvoice) {
          const mapped = mapInvoiceMoneyStatusApiMessage(caught.message);
          if (mapped.length > 0) {
            showInvoiceStageGateRequirements(blockedInvoice, mapped);
            return;
          }
        }
        toast.error(
          getApiErrorMessage(caught, 'Could not update invoice money status. Try again.'),
        );
      }
    },
    [
      invoices,
      onTransitionSuccess,
      selectedInvoice,
      setItems,
      setSelectedInvoice,
      showInvoiceStageGateRequirements,
    ],
  );
}

function usePaymentRecorder(
  fetchInvoices: () => Promise<void>,
  setSelectedInvoice: (invoice: Invoice | null) => void,
  setMutationError: (message: string | null) => void,
) {
  return useCallback(
    async (data: RecordPaymentInput) => {
      await paymentsApi.create(data);
      const updated = await invoicesApi.getById(data.invoiceId);
      setSelectedInvoice(updated);
      try {
        await fetchInvoices();
      } catch (caught) {
        setMutationError(
          getApiErrorMessage(
            caught,
            'Payment was recorded but the invoice list could not be refreshed. Use Refresh.',
          ),
        );
      }
    },
    [fetchInvoices, setMutationError, setSelectedInvoice],
  );
}

function replaceInvoice(invoices: Invoice[], updated: Invoice) {
  return invoices.map((invoice) =>
    invoice.id === updated.id ? { ...invoice, ...updated } : invoice,
  );
}
