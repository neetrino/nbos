import { Plus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, ListMutationErrorBanner, LoadingState } from '@/components/shared';
import type { Invoice } from '@/lib/api/finance';
import type { BoardLifecycleScope } from '@/features/shared/board-lifecycle';
import type { InvoiceViewMode } from './invoice-page-types';
import { InvoiceKanban } from './InvoiceKanban';
import { InvoicesTable } from './InvoicesTable';

interface InvoicesPageContentProps {
  invoices: Invoice[];
  boardScope: BoardLifecycleScope;
  loading: boolean;
  error: string | null;
  mutationError: string | null;
  onDismissMutationError: () => void;
  view: InvoiceViewMode;
  onRetry: () => void;
  onInvoiceClick: (invoice: Invoice) => void;
  onMove: (itemId: string, from: string, to: string) => void;
  onOpenQuickCreate?: () => void;
}

export function InvoicesPageContent({
  invoices,
  boardScope,
  loading,
  error,
  mutationError,
  onDismissMutationError,
  view,
  onRetry,
  onInvoiceClick,
  onMove,
  onOpenQuickCreate,
}: InvoicesPageContentProps) {
  if (loading) return <LoadingState />;
  if (error) return <ErrorState description={error} onRetry={onRetry} />;
  if (invoices.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        {mutationError ? (
          <ListMutationErrorBanner message={mutationError} onDismiss={onDismissMutationError} />
        ) : null}
        <InvoicesEmptyState />
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      {mutationError ? (
        <ListMutationErrorBanner message={mutationError} onDismiss={onDismissMutationError} />
      ) : null}
      {view === 'kanban' ? (
        <InvoiceKanban
          invoices={invoices}
          boardScope={boardScope}
          onInvoiceClick={onInvoiceClick}
          onMove={onMove}
          onOpenQuickCreate={onOpenQuickCreate}
        />
      ) : (
        <InvoicesTable
          invoices={invoices}
          boardScope={boardScope}
          onInvoiceClick={onInvoiceClick}
        />
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
