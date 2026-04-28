import { Plus, FileText } from 'lucide-react';
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
  view: InvoiceViewMode;
  onRetry: () => void;
  onInvoiceClick: (invoice: Invoice) => void;
  onMove: (itemId: string, from: string, to: string) => void;
}

export function InvoicesPageContent({
  invoices,
  loading,
  error,
  view,
  onRetry,
  onInvoiceClick,
  onMove,
}: InvoicesPageContentProps) {
  if (loading) return <LoadingState />;
  if (error) return <ErrorState description={error} onRetry={onRetry} />;
  if (invoices.length === 0) return <InvoicesEmptyState />;
  if (view === 'kanban') {
    return <InvoiceKanban invoices={invoices} onInvoiceClick={onInvoiceClick} onMove={onMove} />;
  }

  return <InvoicesTable invoices={invoices} onInvoiceClick={onInvoiceClick} />;
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
