'use client';

import { Suspense, useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import {
  IntegratedSearchFilters,
  LoadingState,
  useModuleHeroSlots,
  ViewModeSwitch,
} from '@/components/shared';
import { Button } from '@/components/ui/button';
import { InvoiceSheet } from '@/features/finance/components/InvoiceSheet';
import { FinanceListPageSettingsSheet } from '@/features/finance/components/FinanceListPageSettingsSheet';
import { CreateInvoiceDialog } from '@/features/finance/components/invoices/CreateInvoiceDialog';
import { InvoicesPageContent } from '@/features/finance/components/invoices/InvoicesPageContent';
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
import { getFinancePeriodParams } from '@/features/finance/constants/finance';
import {
  buildFinancePeriodFilterConfig,
  FINANCE_PERIOD_FILTER_KEY,
  parseFinancePeriodFilterValue,
} from '@/features/finance/constants/finance-period-filter';
import { useFinanceDocumentTitle } from '@/features/finance/hooks/use-finance-document-title';
import { PORTFOLIO_DEEP_LINK } from '@/features/clients/constants/client-portfolio-deep-links';

const INVOICE_FILTER_CONFIGS_BASE = [
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

  const handleClearFilters = useCallback(() => {
    state.setFilters({});
    state.setPeriod('month');
  }, [state]);

  const invoiceFilterConfigs = useMemo(
    () => [buildFinancePeriodFilterConfig(), ...INVOICE_FILTER_CONFIGS_BASE],
    [],
  );

  const invoiceFilterValues = useMemo(
    () => ({
      [FINANCE_PERIOD_FILTER_KEY]: state.period,
      boardScope: state.filters.boardScope ?? DEFAULT_BOARD_LIFECYCLE_SCOPE,
      ...state.filters,
    }),
    [state.filters, state.period],
  );

  const moduleHeroSlots = useMemo(
    () => ({
      search: (
        <IntegratedSearchFilters
          search={state.search}
          onSearchChange={state.setSearch}
          searchPlaceholder="Search by invoice, company, order, project…"
          filters={invoiceFilterConfigs}
          filterValues={invoiceFilterValues}
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
          <FinanceListPageSettingsSheet
            title="Invoices — settings"
            description="Exports for the current list scope. Period and filters follow the search bar."
            triggerAriaLabel="Invoices settings"
            statsExportDisabled={state.loading || !state.stats}
            exportCsvDisabled={state.loading || exportCsvSubmitting}
            exportCsvInProgress={exportCsvSubmitting}
            onExportScopeStatsCsv={handleExportScopeStatsCsv}
            onExportCsv={handleExportCsv}
            exportCsvLabel="Export invoices (CSV)"
          />
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
      invoiceFilterConfigs,
      invoiceFilterValues,
      state,
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
        onOpenQuickCreate={() => state.setCreateOpen(true)}
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
