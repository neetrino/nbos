'use client';

import { Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { LoadingState } from '@/components/shared';
import { InvoiceSheet } from '@/features/finance/components/InvoiceSheet';
import { CreateInvoiceDialog } from '@/features/finance/components/invoices/CreateInvoiceDialog';
import { InvoiceFilters } from '@/features/finance/components/invoices/InvoiceFilters';
import { InvoicesPageContent } from '@/features/finance/components/invoices/InvoicesPageContent';
import { InvoicesPageHeader } from '@/features/finance/components/invoices/InvoicesPageHeader';
import { InvoiceStatsCards } from '@/features/finance/components/invoices/InvoiceStatsCards';
import { useInvoicesPageState } from '@/features/finance/components/invoices/useInvoicesPageState';
import { SUBSCRIPTION_INVOICES_DRILLDOWN_QUERY } from '@/features/finance/constants/subscription-invoice-drilldown';
import { Button } from '@/components/ui/button';

function InvoicesPageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const subscriptionIdFromUrl = searchParams.get(SUBSCRIPTION_INVOICES_DRILLDOWN_QUERY);

  const state = useInvoicesPageState({ subscriptionIdFromUrl });

  const clearSubscriptionDrilldown = () => {
    router.replace(pathname);
  };

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
