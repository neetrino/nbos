'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { CreditCard, DollarSign, FileText, FolderKanban, Calendar } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  EmptyState,
  ErrorState,
  IntegratedSearchFilters,
  LoadingState,
  StatusBadge,
  useModuleHeroSlots,
} from '@/components/shared';
import {
  getFinancePeriodParams,
  type FinancePeriod,
  formatAmount,
} from '@/features/finance/constants/finance';
import { FinanceListPageSettingsSheet } from '@/features/finance/components/FinanceListPageSettingsSheet';
import {
  buildFinancePeriodFilterConfig,
  FINANCE_PERIOD_FILTER_KEY,
  parseFinancePeriodFilterValue,
} from '@/features/finance/constants/finance-period-filter';
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

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState<FinancePeriod>('month');

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

  const paymentFilterConfigs = useMemo(() => [buildFinancePeriodFilterConfig()], []);

  const paymentFilterValues = useMemo(() => ({ [FINANCE_PERIOD_FILTER_KEY]: period }), [period]);

  const handlePaymentFilterChange = useCallback((key: string, value: string) => {
    if (key === FINANCE_PERIOD_FILTER_KEY) {
      setPeriod(parseFinancePeriodFilterValue(value));
    }
  }, []);

  const handleClearPaymentFilters = useCallback(() => {
    setSearch('');
    setPeriod('month');
  }, []);

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
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState description={error} onRetry={fetchPayments} />
      ) : payments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No payments yet"
          description="Payments appear when invoices are marked as paid"
        />
      ) : (
        <div className="border-border overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment Date</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Company</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Confirmed By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                      <Calendar size={13} className="text-muted-foreground" />
                      {new Date(payment.paymentDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    {payment.invoice ? (
                      <div className="flex items-center gap-1.5 text-sm">
                        <FileText size={12} className="text-muted-foreground" />
                        <span>{payment.invoice.code}</span>
                        {payment.invoice.type ? (
                          <StatusBadge label={payment.invoice.type} variant="blue" />
                        ) : null}
                      </div>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>
                    {payment.project ? (
                      <div className="flex items-center gap-1.5 text-sm">
                        <FolderKanban size={12} className="text-muted-foreground" />
                        {payment.project.name}
                      </div>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {payment.company?.name ?? '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="flex items-center justify-end gap-1 font-semibold text-green-600">
                      <DollarSign size={12} />
                      {formatAmount(parseFloat(payment.amount))}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {payment.paymentMethod ?? '—'}
                  </TableCell>
                  <TableCell className="text-xs">
                    {payment.confirmer
                      ? `${payment.confirmer.firstName} ${payment.confirmer.lastName}`
                      : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
