'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { KanbanBoard, KanbanColumnMoneyTotal } from '@/components/shared';
import {
  buildTerminalDropZonesFromBoard,
  shouldShowTerminalDropBar,
} from '@/features/shared/kanban-terminal-drop';
import { INVOICE_MONEY_STAGES } from '@/features/finance/constants/finance';
import { INVOICE_MONEY_BOARD_STAGES } from '@/features/finance/constants/invoice-board-lifecycle';
import { getBoardStageKeys, type BoardLifecycleScope } from '@/features/shared/board-lifecycle';
import type { StageColumnMeta } from '@/features/shared/kanban/use-stage-column-board';
import { createInvoiceKanbanQuickCreateConfig } from '@/features/finance/kanban/finance-kanban-quick-create';
import { resolveKanbanStageHex } from '@/components/shared/kanban/kanban-stage-hex';
import type { Invoice } from '@/lib/api/finance';
import { INVOICE_STAGE_MESSAGE_KEYS } from './invoice-message-keys';
import { InvoiceKanbanCard } from './InvoiceKanbanCard';

interface InvoiceKanbanProps {
  invoices: Invoice[];
  boardScope: BoardLifecycleScope;
  columnMeta?: Record<string, StageColumnMeta>;
  onColumnLoadMore?: (columnKey: string) => void;
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
  columnMeta,
  onColumnLoadMore,
  onInvoiceClick,
  onMove,
  onOpenQuickCreate,
}: InvoiceKanbanProps) {
  const t = useTranslations('invoices');
  const visibleKeys = getBoardStageKeys(INVOICE_MONEY_BOARD_STAGES, boardScope);
  const columns = INVOICE_MONEY_STAGES.filter((stage) => visibleKeys.includes(stage.value)).map(
    (stage) => {
      const color = STAGE_COLORS[stage.value] ?? 'bg-gray-400';
      const meta = columnMeta?.[stage.value];
      return {
        key: stage.value,
        label: t(INVOICE_STAGE_MESSAGE_KEYS[stage.value]),
        color,
        hexColor: resolveKanbanStageHex(color),
        items: invoices.filter((invoice) => invoice.moneyStatus === stage.value),
        totalCount: meta?.totalCount,
        hasMore: meta?.hasMore,
        loadingMore: meta?.loadingMore,
      };
    },
  );

  const invoiceQuickCreate = useMemo(
    () =>
      onOpenQuickCreate
        ? createInvoiceKanbanQuickCreateConfig(() => onOpenQuickCreate(), t('kanban.quickCreate'))
        : undefined,
    [onOpenQuickCreate, t],
  );

  const invoiceStatusLabels = useMemo(
    () =>
      Object.fromEntries(
        INVOICE_MONEY_STAGES.map((stage) => [
          stage.value,
          t(INVOICE_STAGE_MESSAGE_KEYS[stage.value]),
        ]),
      ) as Record<string, string>,
    [t],
  );

  const terminalDropZones = useMemo(
    () => buildTerminalDropZonesFromBoard(INVOICE_MONEY_BOARD_STAGES, invoiceStatusLabels),
    [invoiceStatusLabels],
  );

  return (
    <KanbanBoard
      columns={columns}
      getItemId={(invoice: Invoice) => invoice.id}
      onMove={onMove}
      onColumnLoadMore={onColumnLoadMore}
      columnQuickCreate={invoiceQuickCreate}
      terminalDropZones={shouldShowTerminalDropBar(boardScope) ? terminalDropZones : undefined}
      columnWidth={boardScope === 'CLOSED' ? 288 : 270}
      emptyMessage={t('kanban.empty')}
      renderColumnHeader={(column) => (
        <KanbanColumnMoneyTotal column={column} getAmount={(invoice) => invoice.amount} />
      )}
      renderCard={(invoice: Invoice) => (
        <InvoiceKanbanCard invoice={invoice} onInvoiceClick={onInvoiceClick} />
      )}
    />
  );
}
