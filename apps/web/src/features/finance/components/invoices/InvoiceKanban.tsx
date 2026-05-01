import { Building2, Calendar } from 'lucide-react';
import { KanbanBoard, StatusBadge, type KanbanColumn } from '@/components/shared';
import { formatAmount, INVOICE_STAGES } from '@/features/finance/constants/finance';
import type { Invoice } from '@/lib/api/finance';

interface InvoiceKanbanProps {
  invoices: Invoice[];
  onInvoiceClick: (invoice: Invoice) => void;
  onMove: (itemId: string, from: string, to: string) => void;
}

const STAGE_COLORS: Record<string, string> = {
  THIS_MONTH: 'bg-blue-500',
  CREATE_INVOICE: 'bg-indigo-500',
  WAITING: 'bg-purple-500',
  DELAYED: 'bg-orange-500',
  ON_HOLD: 'bg-gray-400',
  FAIL: 'bg-red-500',
  PAID: 'bg-green-500',
};

export function InvoiceKanban({ invoices, onInvoiceClick, onMove }: InvoiceKanbanProps) {
  const columns = INVOICE_STAGES.map((stage) => ({
    key: stage.value,
    label: stage.label,
    color: STAGE_COLORS[stage.value] ?? 'bg-gray-400',
    items: invoices.filter((invoice) => invoice.status === stage.value),
  }));

  return (
    <div className="min-h-0 flex-1">
      <KanbanBoard
        columns={columns}
        getItemId={(invoice: Invoice) => invoice.id}
        onMove={onMove}
        columnWidth={270}
        emptyMessage="No invoices"
        renderColumnHeader={(column: KanbanColumn<Invoice>) => (
          <InvoiceKanbanColumnTotal column={column} />
        )}
        renderCard={(invoice: Invoice) => (
          <InvoiceKanbanCard invoice={invoice} onInvoiceClick={onInvoiceClick} />
        )}
      />
    </div>
  );
}

function InvoiceKanbanColumnTotal({ column }: { column: KanbanColumn<Invoice> }) {
  const columnTotal = column.items.reduce((sum, invoice) => sum + parseFloat(invoice.amount), 0);
  return (
    <p className="text-foreground text-lg font-bold tabular-nums">{formatAmount(columnTotal)}</p>
  );
}

function InvoiceKanbanCard({
  invoice,
  onInvoiceClick,
}: {
  invoice: Invoice;
  onInvoiceClick: (invoice: Invoice) => void;
}) {
  return (
    <div
      className="border-border bg-card cursor-pointer space-y-2 rounded-xl border p-3 transition-shadow hover:shadow-sm"
      onClick={() => onInvoiceClick(invoice)}
    >
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs font-medium">{invoice.code}</span>
        {invoice.taxStatus === 'TAX' && <StatusBadge label="Tax" variant="green" />}
      </div>
      <p className="text-sm font-bold">{formatAmount(parseFloat(invoice.amount))}</p>
      {invoice.company && <InvoiceCompany name={invoice.company.name} />}
      {invoice.dueDate && <InvoiceDueDate dueDate={invoice.dueDate} />}
    </div>
  );
}

function InvoiceCompany({ name }: { name: string }) {
  return (
    <div className="text-muted-foreground flex items-center gap-1 text-xs">
      <Building2 size={10} />
      {name}
    </div>
  );
}

function InvoiceDueDate({ dueDate }: { dueDate: string }) {
  return (
    <div className="text-muted-foreground flex items-center gap-1 text-xs">
      <Calendar size={10} />
      {new Date(dueDate).toLocaleDateString()}
    </div>
  );
}
