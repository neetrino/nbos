import { useCallback, useEffect, useState } from 'react';
import { getFinancePeriodParams, type FinancePeriod } from '@/features/finance/constants/finance';
import { invoicesApi, paymentsApi, type Invoice, type InvoiceStats } from '@/lib/api/finance';
import type { FinanceDateRangeParams } from '@/lib/api/finance-common';
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
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [view, setView] = useState<InvoiceViewMode>('kanban');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [period, setPeriod] = useState<FinancePeriod>('month');

  const fetchInvoices = useFetchInvoices({
    search,
    filters,
    period,
    subscriptionIdFromUrl,
    setInvoices,
    setStats,
    setError,
    setLoading,
  });
  const handleStatusChange = useInvoiceStatusChange(invoices, setInvoices);
  const handlePaymentRecorded = usePaymentRecorder(fetchInvoices, setSelectedInvoice);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  return {
    invoices,
    stats,
    loading,
    error,
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
}: {
  search: string;
  filters: Record<string, string>;
  period: FinancePeriod;
  subscriptionIdFromUrl: string | null;
  setInvoices: (invoices: Invoice[]) => void;
  setStats: (stats: InvoiceStats) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}) {
  return useCallback(async () => {
    setLoading(true);
    try {
      const periodParams = getFinancePeriodParams(period);
      const [data, invoiceStats] = await Promise.all([
        invoicesApi.getAll(
          buildInvoiceQuery({ filters, search, subscriptionIdFromUrl }, periodParams),
        ),
        invoicesApi.getStats(periodParams),
      ]);
      setInvoices(data.items);
      setStats(invoiceStats);
      setError(null);
    } catch {
      setError('Invoices could not be loaded. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [filters, period, search, subscriptionIdFromUrl, setError, setInvoices, setLoading, setStats]);
}

function buildInvoiceQuery(
  params: {
    search: string;
    filters: Record<string, string>;
    subscriptionIdFromUrl: string | null;
  },
  periodParams?: FinanceDateRangeParams,
) {
  return {
    pageSize: 200,
    search: params.search || undefined,
    status:
      params.filters.status && params.filters.status !== 'all' ? params.filters.status : undefined,
    type: params.filters.type && params.filters.type !== 'all' ? params.filters.type : undefined,
    subscriptionId: params.subscriptionIdFromUrl || undefined,
    ...periodParams,
  };
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
      } catch {
        setInvoices(() => previousInvoices);
      }
    },
    [invoices, setInvoices],
  );
}

function usePaymentRecorder(
  fetchInvoices: () => Promise<void>,
  setSelectedInvoice: (invoice: Invoice | null) => void,
) {
  return useCallback(
    async (data: RecordPaymentInput) => {
      await paymentsApi.create(data);
      const updated = await invoicesApi.getById(data.invoiceId);
      setSelectedInvoice(updated);
      await fetchInvoices();
    },
    [fetchInvoices, setSelectedInvoice],
  );
}

function replaceInvoice(invoices: Invoice[], updated: Invoice) {
  return invoices.map((invoice) =>
    invoice.id === updated.id ? { ...invoice, ...updated } : invoice,
  );
}
