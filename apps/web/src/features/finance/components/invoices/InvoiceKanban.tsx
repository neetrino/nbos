import { useMemo } from 'react';
import { AlertTriangle, Building2, Calendar, FolderKanban, Handshake } from 'lucide-react';
import { KanbanBoard, KanbanColumnMoneyTotal, StatusBadge } from '@/components/shared';
import {
  buildTerminalDropZonesFromBoard,
  shouldShowTerminalDropBar,
} from '@/features/shared/kanban-terminal-drop';
import {
  formatAmount,
  INVOICE_MONEY_STAGES,
  INVOICE_TYPES,
} from '@/features/finance/constants/finance';
import { parseMoneyAmount } from '@/lib/format/money';
import { INVOICE_MONEY_BOARD_STAGES } from '@/features/finance/constants/invoice-board-lifecycle';
import { getBoardStageKeys, type BoardLifecycleScope } from '@/features/shared/board-lifecycle';
import { resolveInvoiceOverdueDays } from '@/features/finance/utils/invoice-overdue-days';
import { getInvoiceDealTitle } from '@/features/finance/utils/order-display';
import { createInvoiceKanbanQuickCreateConfig } from '@/features/finance/kanban/finance-kanban-quick-create';
import { resolveKanbanStageHex } from '@/components/shared/kanban/kanban-stage-hex';
import type { Invoice } from '@/lib/api/finance';

interface InvoiceKanbanProps {
  invoices: Invoice[];
  boardScope: BoardLifecycleScope;
  onInvoiceClick: (invoice: Invoice) => void;
  onMove: (itemId: string, from: string, to: string) => void;
  onOpenQuickCreate?: () => void;
}

const STAGE_COLORS: Record<string, string> = {
  NEW: 'bg-blue-500',
  AWAITING_PAYMENT: 'bg-purple-500',
  OVERDUE: 'bg-orange-500',
  ON_HOLD: 'bg-gray-400',
  CANCELLED: 'bg-red-500',
  PAID: 'bg-green-500',
};

export function InvoiceKanban({
  invoices,
  boardScope,
  onInvoiceClick,
  onMove,
  onOpenQuickCreate,
}: InvoiceKanbanProps) {
  const visibleKeys = getBoardStageKeys(INVOICE_MONEY_BOARD_STAGES, boardScope);
  const columns = INVOICE_MONEY_STAGES.filter((stage) => visibleKeys.includes(stage.value)).map(
    (stage) => {
      const color = STAGE_COLORS[stage.value] ?? 'bg-gray-400';
      return {
        key: stage.value,
        label: stage.label,
        color,
        hexColor: resolveKanbanStageHex(color),
        items: invoices.filter((invoice) => invoice.moneyStatus === stage.value),
      };
    },
  );

  const invoiceQuickCreate = useMemo(
    () =>
      onOpenQuickCreate
        ? createInvoiceKanbanQuickCreateConfig(() => onOpenQuickCreate())
        : undefined,
    [onOpenQuickCreate],
  );

  const invoiceStatusLabels = useMemo(
    () =>
      Object.fromEntries(INVOICE_MONEY_STAGES.map((stage) => [stage.value, stage.label])) as Record<
        string,
        string
      >,
    [],
  );

  const terminalDropZones = useMemo(
    () => buildTerminalDropZonesFromBoard(INVOICE_MONEY_BOARD_STAGES, invoiceStatusLabels),
    [invoiceStatusLabels],
  );

  return (
    <div className="min-h-0 flex-1">
      <KanbanBoard
        columns={columns}
        getItemId={(invoice: Invoice) => invoice.id}
        onMove={onMove}
        columnQuickCreate={invoiceQuickCreate}
        terminalDropZones={shouldShowTerminalDropBar(boardScope) ? terminalDropZones : undefined}
        columnWidth={boardScope === 'CLOSED' ? 288 : 270}
        emptyMessage="No invoices"
        renderColumnHeader={(column) => (
          <KanbanColumnMoneyTotal column={column} getAmount={(invoice) => invoice.amount} />
        )}
        renderCard={(invoice: Invoice) => (
          <InvoiceKanbanCard invoice={invoice} onInvoiceClick={onInvoiceClick} />
        )}
      />
    </div>
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
  const overdueDays = resolveInvoiceOverdueDays(invoice);
  const dealTitle = getInvoiceDealTitle(invoice.order);

  return (
    <div
      className="border-border bg-card hover:bg-muted/30 cursor-pointer space-y-1.5 rounded-xl border p-3 transition-shadow hover:shadow-sm"
      onClick={() => onInvoiceClick(invoice)}
    >
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs font-medium">{invoice.code}</span>
        {invoice.taxStatus === 'TAX' && <StatusBadge label="Tax" variant="green" />}
      </div>
      <p className="text-foreground text-sm font-bold tabular-nums">
        {formatAmount(parseMoneyAmount(invoice.amount))}
      </p>
      {type ? <StatusBadge label={type.label} variant="blue" /> : null}
      {dealTitle ? <InvoiceDeal name={dealTitle} /> : null}
      {invoice.company && <InvoiceCompany name={invoice.company.name} />}
      {invoice.project && <InvoiceProject name={invoice.project.name} />}
      {invoice.dueDate && <InvoiceDueDate dueDate={invoice.dueDate} />}
      {overdueDays > 0 && <InvoiceOverdueDays days={overdueDays} />}
    </div>
  );
}

function InvoiceDeal({ name }: { name: string }) {
  return (
    <div className="text-muted-foreground flex items-center gap-1 text-xs">
      <Handshake size={10} />
      {name}
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
