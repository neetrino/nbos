'use client';

import { Suspense, useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Download, Loader2, Plus, TableProperties } from 'lucide-react';
import {
  IntegratedSearchFilters,
  LoadingState,
  useModuleHeroSlots,
  ViewModeSwitch,
} from '@/components/shared';
import { Button } from '@/components/ui/button';
import { InvoiceSheet } from '@/features/finance/components/InvoiceSheet';
import { CreateInvoiceDialog } from '@/features/finance/components/invoices/CreateInvoiceDialog';
import { InvoicesPageContent } from '@/features/finance/components/invoices/InvoicesPageContent';
import { FinanceWorkflowScopeBanner } from '@/features/finance/components/FinanceWorkflowScopeBanner';
import { INVOICE_VIEW_OPTIONS } from '@/features/finance/components/invoices/invoice-view-options';
import { INVOICE_MONEY_BOARD_STAGES } from '@/features/finance/constants/invoice-board-lifecycle';
import { INVOICE_MONEY_STAGES, INVOICE_TYPES } from '@/features/finance/constants/finance';
import {
  BOARD_LIFECYCLE_SCOPE_OPTIONS,
  DEFAULT_BOARD_LIFECYCLE_SCOPE,
  matchesBoardLifecycleScope,
  resolveBoardLifecycleScope,
  type BoardLifecycleScope,
} from '@/features/shared/board-lifecycle';
import { useInvoicesCsvExport } from '@/features/finance/components/invoices/use-invoices-csv-export';
import { useInvoicesScopeStatsCsvExport } from '@/features/finance/components/invoices/use-invoices-scope-stats-csv-export';
import { useInvoicesPageState } from '@/features/finance/components/invoices/useInvoicesPageState';
import { invoicesListPageTitle } from '@/features/finance/constants/finance-route-page-titles';
import { OPEN_INVOICE_QUERY } from '@/features/finance/constants/invoice-deep-link';
import { SUBSCRIPTION_INVOICES_DRILLDOWN_QUERY } from '@/features/finance/constants/subscription-invoice-drilldown';
import {
  FINANCE_PERIOD_OPTIONS,
  getFinancePeriodParams,
} from '@/features/finance/constants/finance';
import { useFinanceDocumentTitle } from '@/features/finance/hooks/use-finance-document-title';
import { PORTFOLIO_DEEP_LINK } from '@/features/clients/constants/client-portfolio-deep-links';

const INVOICE_FILTER_CONFIGS = [
  {
    key: 'boardScope',
    label: 'Status',
    includeAllOption: false,
    defaultOptionValue: DEFAULT_BOARD_LIFECYCLE_SCOPE,
    options: BOARD_LIFECYCLE_SCOPE_OPTIONS.map((option) => ({
      value: option.value,
      label: option.label,
    })),
  },
  {
    key: 'moneyStatus',
    label: 'Money status',
    options: INVOICE_MONEY_STAGES.map((stage) => ({ value: stage.value, label: stage.label })),
  },
  {
    key: 'type',
    label: 'Type',
    options: INVOICE_TYPES.map((type) => ({ value: type.value, label: type.label })),
  },
];

function InvoicesPageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const subscriptionIdFromUrl = searchParams.get(SUBSCRIPTION_INVOICES_DRILLDOWN_QUERY);
  const openInvoiceIdFromUrl = searchParams.get(OPEN_INVOICE_QUERY);
  const portfolioCreateInvoiceFromUrl = searchParams.get(PORTFOLIO_DEEP_LINK.createInvoice) === '1';
  const portfolioProjectIdFromUrl = searchParams.get(PORTFOLIO_DEEP_LINK.projectId)?.trim() || null;

  const state = useInvoicesPageState({
    subscriptionIdFromUrl,
    openInvoiceIdFromUrl,
    portfolioCreateInvoiceFromUrl,
    portfolioProjectIdFromUrl,
  });
  const { exportCsvSubmitting, handleExportCsv } = useInvoicesCsvExport(
    state.invoiceListExportParams,
  );

  const periodParams = useMemo(() => getFinancePeriodParams(state.period), [state.period]);

  const { handleExportScopeStatsCsv } = useInvoicesScopeStatsCsvExport(state.stats, {
    period: state.period,
    dateFrom: periodParams?.dateFrom,
    dateTo: periodParams?.dateTo,
    subscriptionId: subscriptionIdFromUrl?.trim() || undefined,
  });

  useFinanceDocumentTitle(invoicesListPageTitle(Boolean(subscriptionIdFromUrl?.trim())));

  const clearSubscriptionDrilldown = () => {
    router.replace(pathname);
  };

  const boardScope = resolveBoardLifecycleScope(state.filters.boardScope);
  const hasMoneyStatusFilter =
    Boolean(state.filters.moneyStatus) && state.filters.moneyStatus !== 'all';

  const displayInvoices = useMemo(() => {
    if (hasMoneyStatusFilter) return state.invoices;
    return state.invoices.filter((invoice) =>
      matchesBoardLifecycleScope(invoice.moneyStatus, INVOICE_MONEY_BOARD_STAGES, boardScope),
    );
  }, [state.invoices, boardScope, hasMoneyStatusFilter]);

  const handleFilterChange = useCallback(
    (key: string, value: string) => {
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

  const handleClearFilters = useCallback(() => {
    state.setFilters({});
  }, [state]);

  const moduleHeroSlots = useMemo(
    () => ({
      search: (
        <IntegratedSearchFilters
          search={state.search}
          onSearchChange={state.setSearch}
          searchPlaceholder="Search by invoice, company, order, project…"
          filters={INVOICE_FILTER_CONFIGS}
          filterValues={{
            boardScope: state.filters.boardScope ?? DEFAULT_BOARD_LIFECYCLE_SCOPE,
            ...state.filters,
          }}
          onFilterChange={handleFilterChange}
          onClearAll={handleClearFilters}
        />
      ),
      viewMode: (
        <ViewModeSwitch
          value={state.view}
          onChange={state.setView}
          options={INVOICE_VIEW_OPTIONS}
        />
      ),
      trailing: (
        <>
          <div className="border-border flex rounded-lg border p-1">
            {FINANCE_PERIOD_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={state.period === option.value ? 'secondary' : 'ghost'}
                size="sm"
                type="button"
                onClick={() => state.setPeriod(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={state.loading || !state.stats}
            onClick={() => handleExportScopeStatsCsv()}
            aria-label="Export invoice scope statistics as CSV"
            title="UTF-8 CSV snapshot from GET /finance/invoices/stats"
          >
            <TableProperties size={16} aria-hidden />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={state.loading || exportCsvSubmitting}
            onClick={() => {
              void handleExportCsv();
            }}
            aria-label="Export invoices as CSV"
            title="Export all rows matching current filters"
          >
            {exportCsvSubmitting ? (
              <Loader2 size={16} className="animate-spin" aria-hidden />
            ) : (
              <Download size={16} aria-hidden />
            )}
          </Button>
          <Button type="button" onClick={() => state.setCreateOpen(true)}>
            <Plus size={16} aria-hidden />
            New Invoice
          </Button>
        </>
      ),
    }),
    [
      exportCsvSubmitting,
      handleClearFilters,
      handleExportCsv,
      handleExportScopeStatsCsv,
      handleFilterChange,
      state.filters,
      state.loading,
      state.period,
      state.search,
      state.stats,
      state.view,
      state.setCreateOpen,
      state.setPeriod,
      state.setSearch,
      state.setView,
    ],
  );

  useModuleHeroSlots(moduleHeroSlots);

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      {subscriptionIdFromUrl ? (
        <div className="border-border bg-muted/40 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm">
          <p className="text-foreground max-w-prose">
            Showing invoices linked to this subscription (server filter).
          </p>
          <Button variant="outline" size="sm" type="button" onClick={clearSubscriptionDrilldown}>
            Clear filter
          </Button>
        </div>
      ) : null}
      {boardScope === 'CLOSED' && !hasMoneyStatusFilter ? (
        <FinanceWorkflowScopeBanner variant="invoice-closed" />
      ) : null}
      <InvoicesPageContent
        invoices={displayInvoices}
        boardScope={boardScope as BoardLifecycleScope}
        loading={state.loading}
        error={state.error}
        mutationError={state.mutationError}
        onDismissMutationError={state.clearMutationError}
        view={state.view}
        onRetry={state.fetchInvoices}
        onInvoiceClick={state.handleInvoiceClick}
        onMove={(itemId, _from, toColumn) => state.handleMoneyStatusChange(itemId, toColumn)}
      />
      <InvoiceSheet
        invoice={state.selectedInvoice}
        open={state.sheetOpen}
        onOpenChange={state.handleInvoiceSheetOpenChange}
        onInvoiceUpdated={state.handleInvoiceUpdated}
        onMoneyStatusChange={state.handleMoneyStatusChange}
        onPaymentRecorded={state.handlePaymentRecorded}
        stageGateHighlight={state.stageGateHighlight}
      />
      <CreateInvoiceDialog
        open={state.createDialogOpen}
        onOpenChange={state.handleCreateDialogOpenChange}
        onCreated={state.handleInvoiceCreated}
        subscriptionId={subscriptionIdFromUrl}
        initialProjectId={portfolioCreateInvoiceFromUrl ? portfolioProjectIdFromUrl : null}
      />
    </div>
  );
}

export default function InvoicesPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <InvoicesPageInner />
    </Suspense>
  );
}
