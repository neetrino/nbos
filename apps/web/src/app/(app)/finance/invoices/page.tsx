'use client';

import { InvoiceSheet } from '@/features/finance/components/InvoiceSheet';
import { CreateInvoiceDialog } from '@/features/finance/components/invoices/CreateInvoiceDialog';
import { InvoiceFilters } from '@/features/finance/components/invoices/InvoiceFilters';
import { InvoicesPageContent } from '@/features/finance/components/invoices/InvoicesPageContent';
import { InvoicesPageHeader } from '@/features/finance/components/invoices/InvoicesPageHeader';
import { InvoiceStatsCards } from '@/features/finance/components/invoices/InvoiceStatsCards';
import { useInvoicesPageState } from '@/features/finance/components/invoices/useInvoicesPageState';

export default function InvoicesPage() {
  const state = useInvoicesPageState();

  return (
    <div className="flex h-full flex-col gap-5">
      <InvoicesPageHeader
        invoiceCount={state.invoices.length}
        period={state.period}
        view={state.view}
        onPeriodChange={state.setPeriod}
        onViewChange={state.setView}
        onRefresh={state.fetchInvoices}
      />
      <InvoiceStatsCards stats={state.stats} />
      <InvoiceFilters
        search={state.search}
        filters={state.filters}
        onSearchChange={state.setSearch}
        onFilterChange={state.setFilters}
        onCreateInvoice={() => state.setCreateOpen(true)}
      />
      <InvoicesPageContent
        invoices={state.invoices}
        loading={state.loading}
        error={state.error}
        view={state.view}
        onRetry={state.fetchInvoices}
        onInvoiceClick={state.handleInvoiceClick}
        onMove={(itemId, _from, toColumn) => state.handleStatusChange(itemId, toColumn)}
      />
      <InvoiceSheet
        invoice={state.selectedInvoice}
        open={state.sheetOpen}
        onOpenChange={state.setSheetOpen}
        onPaymentRecorded={state.handlePaymentRecorded}
      />
      <CreateInvoiceDialog
        open={state.createOpen}
        onOpenChange={state.setCreateOpen}
        onCreated={state.handleInvoiceCreated}
      />
    </div>
  );
}
