'use client';

import { Suspense, useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { LoadingState } from '@/components/shared';
import { InvoiceSheet } from '@/features/finance/components/InvoiceSheet';
import { CreateInvoiceDialog } from '@/features/finance/components/invoices/CreateInvoiceDialog';
import { InvoiceFilters } from '@/features/finance/components/invoices/InvoiceFilters';
import { InvoicesPageContent } from '@/features/finance/components/invoices/InvoicesPageContent';
import { FinanceWorkflowScopeBanner } from '@/features/finance/components/FinanceWorkflowScopeBanner';
import { InvoicesPageHeader } from '@/features/finance/components/invoices/InvoicesPageHeader';
import { INVOICE_MONEY_BOARD_STAGES } from '@/features/finance/constants/invoice-board-lifecycle';
import {
  DEFAULT_BOARD_LIFECYCLE_SCOPE,
  matchesBoardLifecycleScope,
  resolveBoardLifecycleScope,
  type BoardLifecycleScope,
} from '@/features/shared/board-lifecycle';
import { InvoiceStatsCards } from '@/features/finance/components/invoices/InvoiceStatsCards';
import { useInvoicesCsvExport } from '@/features/finance/components/invoices/use-invoices-csv-export';
import { useInvoicesScopeStatsCsvExport } from '@/features/finance/components/invoices/use-invoices-scope-stats-csv-export';
import { useInvoicesPageState } from '@/features/finance/components/invoices/useInvoicesPageState';
import { invoicesListPageTitle } from '@/features/finance/constants/finance-route-page-titles';
import { OPEN_INVOICE_QUERY } from '@/features/finance/constants/invoice-deep-link';
import { SUBSCRIPTION_INVOICES_DRILLDOWN_QUERY } from '@/features/finance/constants/subscription-invoice-drilldown';
import { getFinancePeriodParams } from '@/features/finance/constants/finance';
import { useFinanceDocumentTitle } from '@/features/finance/hooks/use-finance-document-title';
import { Button } from '@/components/ui/button';
import { PORTFOLIO_DEEP_LINK } from '@/features/clients/constants/client-portfolio-deep-links';

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
    [state.setFilters],
  );

  const handleClearFilters = useCallback(() => {
    state.setFilters({});
  }, [state.setFilters]);

  return (
    <div className="flex h-full flex-col gap-5">
      <InvoicesPageHeader
        invoiceCount={displayInvoices.length}
        period={state.period}
        view={state.view}
        onPeriodChange={state.setPeriod}
        onViewChange={state.setView}
        onExportCsv={handleExportCsv}
        exportDisabled={state.loading || exportCsvSubmitting}
        exportInProgress={exportCsvSubmitting}
        statsExportDisabled={state.loading || !state.stats}
        onExportScopeStatsCsv={handleExportScopeStatsCsv}
      />
      <InvoiceStatsCards stats={state.stats} />
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
      <InvoiceFilters
        search={state.search}
        filters={state.filters}
        onSearchChange={state.setSearch}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        onCreateInvoice={() => state.setCreateOpen(true)}
      />
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
        onPaymentRecorded={state.handlePaymentRecorded}
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
