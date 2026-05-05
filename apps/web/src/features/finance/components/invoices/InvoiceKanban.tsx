import { AlertTriangle, Building2, Calendar, FolderKanban } from 'lucide-react';
import { KanbanBoard, StatusBadge, type KanbanColumn } from '@/components/shared';
import {
  formatAmount,
  getInvoiceStage,
  INVOICE_MONEY_STAGES,
  INVOICE_TYPES,
} from '@/features/finance/constants/finance';
import type { Invoice } from '@/lib/api/finance';

interface InvoiceKanbanProps {
  invoices: Invoice[];
  onInvoiceClick: (invoice: Invoice) => void;
  onMove: (itemId: string, from: string, to: string) => void;
}

const STAGE_COLORS: Record<string, string> = {
  NEW: 'bg-blue-500',
  AWAITING_PAYMENT: 'bg-purple-500',
  OVERDUE: 'bg-orange-500',
  ON_HOLD: 'bg-gray-400',
  CANCELLED: 'bg-red-500',
  PAID: 'bg-green-500',
};
const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function InvoiceKanban({ invoices, onInvoiceClick, onMove }: InvoiceKanbanProps) {
  const columns = INVOICE_MONEY_STAGES.map((stage) => ({
    key: stage.value,
    label: stage.label,
    color: STAGE_COLORS[stage.value] ?? 'bg-gray-400',
    items: invoices.filter((invoice) => invoice.moneyStatus === stage.value),
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

function InvoiceLegacyPipelineBadge({ status }: { status: string }) {
  const stage = getInvoiceStage(status);
  if (!stage) return null;
  return <StatusBadge label={stage.label} variant={stage.variant} />;
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
  const type = INVOICE_TYPES.find((invoiceType) => invoiceType.value === invoice.type);
  const overdueDays = resolveOverdueDays(invoice);

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
      {type && <StatusBadge label={type.label} variant="blue" />}
      <InvoiceLegacyPipelineBadge status={invoice.status} />
      {invoice.company && <InvoiceCompany name={invoice.company.name} />}
      {invoice.project && <InvoiceProject name={invoice.project.name} />}
      {invoice.dueDate && <InvoiceDueDate dueDate={invoice.dueDate} />}
      {overdueDays > 0 && <InvoiceOverdueDays days={overdueDays} />}
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

function InvoiceProject({ name }: { name: string }) {
  return (
    <div className="text-muted-foreground flex items-center gap-1 text-xs">
      <FolderKanban size={10} />
      {name}
    </div>
  );
}

function InvoiceOverdueDays({ days }: { days: number }) {
  return (
    <div className="flex items-center gap-1 text-xs font-medium text-red-500">
      <AlertTriangle size={10} />
      {days}d overdue
    </div>
  );
}

function resolveOverdueDays(invoice: Invoice) {
  if (!invoice.dueDate || invoice.moneyStatus === 'PAID') return 0;

  const dueDate = new Date(invoice.dueDate);
  const now = new Date();
  dueDate.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  return Math.max(0, Math.floor((now.getTime() - dueDate.getTime()) / DAY_IN_MS));
}
