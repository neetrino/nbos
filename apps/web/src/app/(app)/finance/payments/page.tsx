'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import {
  DataView,
  EmptyState,
  ErrorState,
  IntegratedSearchFilters,
  ListMutationErrorBanner,
  LoadingState,
  useModuleHeroSlots,
} from '@/components/shared';
import { getFinancePeriodParams, type FinancePeriod } from '@/features/finance/constants/finance';
import { FinanceListPageSettingsSheet } from '@/features/finance/components/FinanceListPageSettingsSheet';
import {
  buildFinancePeriodFilterConfig,
  FINANCE_DEFAULT_LIST_PERIOD,
  FINANCE_PERIOD_FILTER_KEY,
  parseFinancePeriodFilterValue,
} from '@/features/finance/constants/finance-period-filter';
import { OPEN_PAYMENT_QUERY } from '@/features/finance/constants/payment-deep-link';
import { PaymentDetailSheet } from '@/features/finance/components/payments/PaymentDetailSheet';
import { PaymentsListTable } from '@/features/finance/components/payments/PaymentsListTable';
import { usePaymentsCsvExport } from '@/features/finance/components/payments/use-payments-csv-export';
import { usePaymentsScopeStatsCsvExport } from '@/features/finance/components/payments/use-payments-scope-stats-csv-export';
import { buildPaymentListApiParams } from '@/features/finance/utils/build-payment-list-api-params';
import { paymentsListPageTitle } from '@/features/finance/constants/finance-route-page-titles';
import { useFinanceDocumentTitle } from '@/features/finance/hooks/use-finance-document-title';
import {
  paymentsApi,
  type Payment,
  type PaymentListParams,
  type PaymentStats,
} from '@/lib/api/finance';
import { getApiErrorMessage } from '@/lib/api-errors';
import { SEARCH_FILTER_PAGE_ID, usePersistedSearchFilterField } from '@/lib/persisted-client-state';

export default function PaymentsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const openPaymentIdFromUrl = searchParams.get(OPEN_PAYMENT_QUERY)?.trim() || null;

  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [periodRaw, setPeriodRaw] = usePersistedSearchFilterField(
    SEARCH_FILTER_PAGE_ID.financePayments,
    FINANCE_PERIOD_FILTER_KEY,
    FINANCE_DEFAULT_LIST_PERIOD,
  );
  const period = parseFinancePeriodFilterValue(periodRaw);
  const setPeriod = useCallback((next: FinancePeriod) => setPeriodRaw(next), [setPeriodRaw]);

  const paymentListExportParams: Omit<PaymentListParams, 'page' | 'pageSize'> = useMemo(
    () => buildPaymentListApiParams({ search, period }),
    [search, period],
  );

  const { exportCsvSubmitting, handleExportCsv } = usePaymentsCsvExport(paymentListExportParams);

  const periodParamsForStats = useMemo(() => getFinancePeriodParams(period), [period]);

  const { handleExportScopeStatsCsv } = usePaymentsScopeStatsCsvExport(stats, {
    period,
    dateFrom: periodParamsForStats?.dateFrom,
    dateTo: periodParamsForStats?.dateTo,
  });

  useFinanceDocumentTitle(paymentsListPageTitle());

  const stripOpenPaymentFromUrl = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (!params.has(OPEN_PAYMENT_QUERY)) return;
    params.delete(OPEN_PAYMENT_QUERY);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const pushOpenPaymentToUrl = useCallback(
    (paymentId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(OPEN_PAYMENT_QUERY, paymentId);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const periodParams = getFinancePeriodParams(period);
      const listParams = buildPaymentListApiParams({ search, period });
      const [data, paymentStats] = await Promise.all([
        paymentsApi.getAll({
          ...listParams,
          pageSize: 100,
        }),
        paymentsApi.getStats(periodParams),
      ]);
      setPayments(data.items);
      setStats(paymentStats);
      setError(null);
    } catch (caught) {
      setError(
        getApiErrorMessage(
          caught,
          'Payments could not be loaded. Check your connection and try again.',
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [search, period]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handlePaymentClick = useCallback(
    (payment: Payment) => {
      setSelectedPayment(payment);
      setSheetOpen(true);
      pushOpenPaymentToUrl(payment.id);
    },
    [pushOpenPaymentToUrl],
  );

  const handlePaymentSheetOpenChange = useCallback(
    (nextOpen: boolean) => {
      setSheetOpen(nextOpen);
      if (!nextOpen) {
        setSelectedPayment(null);
        stripOpenPaymentFromUrl();
      }
    },
    [stripOpenPaymentFromUrl],
  );

  const handlePaymentDeleted = useCallback(
    (paymentId: string) => {
      setPayments((current) => current.filter((row) => row.id !== paymentId));
      void fetchPayments();
    },
    [fetchPayments],
  );

  useEffect(() => {
    if (!openPaymentIdFromUrl) return;
    const fromList = payments.find((row) => row.id === openPaymentIdFromUrl);
    if (fromList) {
      setSelectedPayment(fromList);
      setSheetOpen(true);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const data = await paymentsApi.getById(openPaymentIdFromUrl);
        if (!cancelled) {
          setSelectedPayment(data);
          setSheetOpen(true);
        }
      } catch (caught) {
        toast.error(getApiErrorMessage(caught, 'Payment could not be opened.'));
        stripOpenPaymentFromUrl();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [openPaymentIdFromUrl, payments, stripOpenPaymentFromUrl]);

  const paymentFilterConfigs = useMemo(() => [buildFinancePeriodFilterConfig()], []);

  const paymentFilterValues = useMemo(() => ({ [FINANCE_PERIOD_FILTER_KEY]: period }), [period]);

  const handlePaymentFilterChange = useCallback(
    (key: string, value: string) => {
      if (key === FINANCE_PERIOD_FILTER_KEY) {
        setPeriod(parseFinancePeriodFilterValue(value));
      }
    },
    [setPeriod],
  );

  const handleClearPaymentFilters = useCallback(() => {
    setSearch('');
    setPeriod(FINANCE_DEFAULT_LIST_PERIOD);
  }, [setPeriod]);

  const moduleHeroSlots = useMemo(
    () => ({
      search: (
        <IntegratedSearchFilters
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by invoice, company, order, project, notes…"
          filters={paymentFilterConfigs}
          filterValues={paymentFilterValues}
          onFilterChange={handlePaymentFilterChange}
          onClearAll={handleClearPaymentFilters}
        />
      ),
      trailing: (
        <FinanceListPageSettingsSheet
          title="Payments — settings"
          description="Exports for the current list scope. Period follows filters in the search bar."
          triggerAriaLabel="Payments settings"
          statsExportDisabled={loading || !stats}
          exportCsvDisabled={loading || exportCsvSubmitting}
          exportCsvInProgress={exportCsvSubmitting}
          onExportScopeStatsCsv={handleExportScopeStatsCsv}
          onExportCsv={handleExportCsv}
          exportCsvLabel="Export payments (CSV)"
        />
      ),
    }),
    [
      exportCsvSubmitting,
      handleClearPaymentFilters,
      handleExportCsv,
      handleExportScopeStatsCsv,
      handlePaymentFilterChange,
      loading,
      paymentFilterConfigs,
      paymentFilterValues,
      search,
      stats,
    ],
  );

  useModuleHeroSlots(moduleHeroSlots);

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      {error && payments.length > 0 ? (
        <ListMutationErrorBanner message={error} onDismiss={() => setError(null)} />
      ) : null}
      <DataView
        loading={loading}
        error={error}
        hasData={payments.length > 0}
        loadingFallback={<LoadingState />}
        errorFallback={<ErrorState description={error ?? ''} onRetry={fetchPayments} />}
        emptyFallback={
          <EmptyState
            icon={CreditCard}
            title="No payments yet"
            description="Payments appear when invoices are marked as paid"
          />
        }
      >
        <PaymentsListTable payments={payments} onOpenPayment={handlePaymentClick} />
      </DataView>

      <PaymentDetailSheet
        paymentId={sheetOpen ? (openPaymentIdFromUrl ?? selectedPayment?.id ?? null) : null}
        initialPayment={selectedPayment}
        open={sheetOpen || Boolean(openPaymentIdFromUrl)}
        onOpenChange={handlePaymentSheetOpenChange}
        onPaymentDeleted={handlePaymentDeleted}
      />
    </div>
  );
}
