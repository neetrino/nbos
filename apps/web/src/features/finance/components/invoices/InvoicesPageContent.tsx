import { Plus, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared';
import type { Invoice } from '@/lib/api/finance';
import type { InvoiceViewMode } from './invoice-page-types';
import { InvoiceKanban } from './InvoiceKanban';
import { InvoicesTable } from './InvoicesTable';

interface InvoicesPageContentProps {
  invoices: Invoice[];
  loading: boolean;
  error: string | null;
  mutationError: string | null;
  onDismissMutationError: () => void;
  view: InvoiceViewMode;
  onRetry: () => void;
  onInvoiceClick: (invoice: Invoice) => void;
  onMove: (itemId: string, from: string, to: string) => void;
}

function InvoiceMutationBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div
      className="border-destructive/40 bg-destructive/5 flex flex-wrap items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm"
      role="alert"
    >
      <p className="text-destructive max-w-prose">{message}</p>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-destructive hover:text-destructive shrink-0"
        onClick={onDismiss}
        aria-label="Dismiss error"
      >
        <X size={16} />
      </Button>
    </div>
  );
}

export function InvoicesPageContent({
  invoices,
  loading,
  error,
  mutationError,
  onDismissMutationError,
  view,
  onRetry,
  onInvoiceClick,
  onMove,
}: InvoicesPageContentProps) {
  if (loading) return <LoadingState />;
  if (error) return <ErrorState description={error} onRetry={onRetry} />;
  if (invoices.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        {mutationError ? (
          <InvoiceMutationBanner message={mutationError} onDismiss={onDismissMutationError} />
        ) : null}
        <InvoicesEmptyState />
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      {mutationError ? (
        <InvoiceMutationBanner message={mutationError} onDismiss={onDismissMutationError} />
      ) : null}
      {view === 'kanban' ? (
        <InvoiceKanban invoices={invoices} onInvoiceClick={onInvoiceClick} onMove={onMove} />
      ) : (
        <InvoicesTable invoices={invoices} onInvoiceClick={onInvoiceClick} />
      )}
    </div>
  );
}

function InvoicesEmptyState() {
  return (
    <EmptyState
      icon={FileText}
      title="No invoices yet"
      description="Create your first invoice to start tracking payments"
      action={
        <Button>
          <Plus size={16} />
          Create First Invoice
        </Button>
      }
    />
  );
}
