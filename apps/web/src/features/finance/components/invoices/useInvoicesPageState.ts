import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { getFinancePeriodParams, type FinancePeriod } from '@/features/finance/constants/finance';
import { buildInvoiceListApiParams } from '@/features/finance/utils/build-invoice-list-api-params';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  invoicesApi,
  paymentsApi,
  type Invoice,
  type InvoiceListParams,
  type InvoiceStats,
} from '@/lib/api/finance';
import type { InvoiceViewMode } from './invoice-page-types';

interface RecordPaymentInput {
  invoiceId: string;
  amount: number;
  paymentDate: string;
  paymentMethod?: string;
  notes?: string;
}

interface UseInvoicesPageStateOptions {
  subscriptionIdFromUrl?: string | null;
}

export function useInvoicesPageState(options?: UseInvoicesPageStateOptions) {
  const subscriptionIdFromUrl = options?.subscriptionIdFromUrl?.trim() || null;
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [view, setView] = useState<InvoiceViewMode>('kanban');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [period, setPeriod] = useState<FinancePeriod>('month');

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

  const fetchInvoices = useFetchInvoices({
    search,
    filters,
    period,
    subscriptionIdFromUrl,
    setInvoices,
    setStats,
    setError,
    setLoading,
    setMutationError,
  });
  const handleStatusChange = useInvoiceStatusChange(invoices, setInvoices);
  const handlePaymentRecorded = usePaymentRecorder(
    fetchInvoices,
    setSelectedInvoice,
    setMutationError,
  );

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  return {
    invoices,
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
    createOpen,
    setCreateOpen,
    period,
    setPeriod,
    fetchInvoices,
    handleInvoiceClick: (invoice: Invoice) => {
      setSelectedInvoice(invoice);
      setSheetOpen(true);
    },
    handleStatusChange,
    handlePaymentRecorded,
    handleInvoiceCreated: fetchInvoices,
    invoiceListExportParams,
  };
}

function useFetchInvoices({
  search,
  filters,
  period,
  subscriptionIdFromUrl,
  setInvoices,
  setStats,
  setError,
  setLoading,
  setMutationError,
}: {
  search: string;
  filters: Record<string, string>;
  period: FinancePeriod;
  subscriptionIdFromUrl: string | null;
  setInvoices: (invoices: Invoice[]) => void;
  setStats: (stats: InvoiceStats) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  setMutationError: (message: string | null) => void;
}) {
  return useCallback(async () => {
    setLoading(true);
    try {
      const periodParams = getFinancePeriodParams(period);
      const listParams = buildInvoiceListApiParams({
        search,
        filters,
        subscriptionIdFromUrl,
        period,
      });
      const [data, invoiceStats] = await Promise.all([
        invoicesApi.getAll({ ...listParams, pageSize: 200 }),
        invoicesApi.getStats({
          ...periodParams,
          ...(subscriptionIdFromUrl ? { subscriptionId: subscriptionIdFromUrl } : {}),
        }),
      ]);
      setInvoices(data.items);
      setStats(invoiceStats);
      setError(null);
      setMutationError(null);
    } catch (caught) {
      setError(
        getApiErrorMessage(
          caught,
          'Invoices could not be loaded. Check your connection and try again.',
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [
    filters,
    period,
    search,
    subscriptionIdFromUrl,
    setError,
    setInvoices,
    setLoading,
    setMutationError,
    setStats,
  ]);
}

function useInvoiceStatusChange(
  invoices: Invoice[],
  setInvoices: (updater: (current: Invoice[]) => Invoice[]) => void,
) {
  return useCallback(
    async (id: string, status: string) => {
      const previousInvoices = invoices;
      setInvoices((current) =>
        current.map((invoice) => (invoice.id === id ? { ...invoice, status } : invoice)),
      );
      try {
        const updated = await invoicesApi.updateStatus(id, status);
        setInvoices((current) => replaceInvoice(current, updated));
      } catch (caught) {
        setInvoices(() => previousInvoices);
        toast.error(getApiErrorMessage(caught, 'Could not update invoice status. Try again.'));
      }
    },
    [invoices, setInvoices],
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
