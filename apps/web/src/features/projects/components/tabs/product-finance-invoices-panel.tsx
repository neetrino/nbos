'use client';

import { useCallback, useMemo, useState } from 'react';
import { CreateInvoiceDialog } from '@/features/finance/components/invoices/CreateInvoiceDialog';
import { InvoiceKanban } from '@/features/finance/components/invoices/InvoiceKanban';
import { InvoicesTable } from '@/features/finance/components/invoices/InvoicesTable';
import { InvoiceSheet } from '@/features/finance/components/InvoiceSheet';
import type { InvoiceViewMode } from '@/features/finance/components/invoices/invoice-page-types';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared';
import { Button, buttonVariants } from '@/components/ui/button';
import { FileText, Plus } from 'lucide-react';
import Link from 'next/link';
import { PRODUCT_FINANCE_INVOICE_PAGE_SIZE } from '@/features/projects/constants/product-finance.constants';
import { cn } from '@/lib/utils';
import { invoicesApi, paymentsApi, type Invoice } from '@/lib/api/finance';
import { useProductEntityDetailSheet } from '@/features/projects/hooks/use-product-entity-detail-sheet';
import { useProductFinanceInvoices } from '@/features/projects/hooks/use-product-finance-invoices';
import { filterProductFinanceInvoices } from '@/features/projects/utils/filter-product-finance-data';
import {
  resolveBoardLifecycleScope,
  type BoardLifecycleScope,
} from '@/features/shared/board-lifecycle';
import { usePermission } from '@/lib/permissions';

interface ProductFinanceInvoicesPanelProps {
  productId: string;
  companyId?: string | null;
  search: string;
  filters: Record<string, string>;
  view: InvoiceViewMode;
}

export function ProductFinanceInvoicesPanel({
  productId,
  companyId,
  search,
  filters,
  view,
}: ProductFinanceInvoicesPanelProps) {
  const { can } = usePermission();
  const invoiceSheet = useProductEntityDetailSheet<Invoice>();
  const { invoices, truncated, loading, error, refetch, setInvoices } =
    useProductFinanceInvoices(productId);
  const [createOpen, setCreateOpen] = useState(false);
  const canCreate = can('FINANCE_INVOICES', 'ADD');

  const boardScope = resolveBoardLifecycleScope(filters.boardScope) as BoardLifecycleScope;
  const displayInvoices = useMemo(
    () => filterProductFinanceInvoices(invoices, search, filters),
    [invoices, search, filters],
  );

  const selectedInvoice = useMemo(
    () => invoices.find((invoice) => invoice.id === invoiceSheet.entityId) ?? null,
    [invoices, invoiceSheet.entityId],
  );

  const handleOpenInvoice = useCallback(
    (invoice: Invoice) => {
      invoiceSheet.openEntity(invoice);
    },
    [invoiceSheet],
  );

  const handleMoneyStatusChange = useCallback(
    async (invoiceId: string, moneyStatus: string) => {
      const updated = await invoicesApi.updateMoneyStatus(invoiceId, moneyStatus);
      setInvoices((current) =>
        current.map((invoice) => (invoice.id === updated.id ? updated : invoice)),
      );
    },
    [setInvoices],
  );

  const handlePaymentRecorded = useCallback(
    async (data: {
      invoiceId: string;
      amount: number;
      paymentDate: string;
      paymentMethod?: string;
      notes?: string;
    }) => {
      await paymentsApi.create(data);
      const updated = await invoicesApi.getById(data.invoiceId);
      setInvoices((current) =>
        current.map((invoice) => (invoice.id === updated.id ? updated : invoice)),
      );
    },
    [setInvoices],
  );

  if (loading) return <LoadingState />;
  if (error) return <ErrorState description={error} onRetry={() => void refetch()} />;

  return (
    <>
      {truncated ? (
        <p className="text-muted-foreground mb-3 text-sm">
          Showing the first {PRODUCT_FINANCE_INVOICE_PAGE_SIZE} invoices.{' '}
          <Link
            href="/finance/invoices"
            className={cn(buttonVariants({ variant: 'link' }), 'h-auto px-0')}
          >
            Open all invoices in Finance
          </Link>
        </p>
      ) : null}
      {displayInvoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No invoices"
          description="No invoices match your filters for this product."
          action={
            canCreate ? (
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus size={16} />
                New Invoice
              </Button>
            ) : undefined
          }
        />
      ) : view === 'list' ? (
        <InvoicesTable
          invoices={displayInvoices}
          boardScope={boardScope}
          onInvoiceClick={handleOpenInvoice}
        />
      ) : (
        <InvoiceKanban
          invoices={displayInvoices}
          boardScope={boardScope}
          onInvoiceClick={handleOpenInvoice}
          onMove={(itemId, _from, toColumn) => void handleMoneyStatusChange(itemId, toColumn)}
          onOpenQuickCreate={canCreate ? () => setCreateOpen(true) : undefined}
        />
      )}
      <InvoiceSheet
        invoice={selectedInvoice}
        open={invoiceSheet.isOpen}
        onOpenChange={invoiceSheet.handleOpenChange}
        onInvoiceUpdated={(updated) => {
          setInvoices((current) =>
            current.map((invoice) => (invoice.id === updated.id ? updated : invoice)),
          );
        }}
        onInvoiceDeleted={(invoiceId) => {
          setInvoices((current) => current.filter((invoice) => invoice.id !== invoiceId));
          invoiceSheet.handleOpenChange(false);
        }}
        onMoneyStatusChange={handleMoneyStatusChange}
        onPaymentRecorded={handlePaymentRecorded}
      />
      {canCreate ? (
        <CreateInvoiceDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreated={() => void refetch()}
          hiddenContext={{ productId, companyId }}
        />
      ) : null}
    </>
  );
}
