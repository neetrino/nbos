'use client';

import { useKanbanHorizontalScroll } from '@/components/shared/kanban/use-kanban-horizontal-scroll';
import {
  KANBAN_BOARD_MOBILE_SCROLL_CLASS,
  KANBAN_HORIZONTAL_SCROLL_HIDE_SCROLLBAR_CLASS,
} from '@/components/shared/kanban/kanban-scroll-classes';
import { KANBAN_COLUMN_X_MARGIN_TOTAL_PX } from '@/components/shared/kanban/kanban.types';
import { CLIENT_SERVICE_BOARD_COLUMN_WIDTH } from '@/features/finance/constants/client-service-payment-stage';
import type { ClientServiceRecord, ClientServiceRecordListParams } from '@/lib/api/client-services';
import { cn } from '@/lib/utils';
import { ClientServiceBoardColumn } from './ClientServiceBoardColumn';
import type { ClientServiceListSeed } from './use-client-service-list';

export interface ClientServiceBoardColumnDef {
  key: string;
  label: string;
  hex: string;
  count: number;
  sum: string;
  params: ClientServiceRecordListParams;
  seed?: ClientServiceListSeed | null;
}

interface ClientServiceBoardScrollProps {
  columns: ClientServiceBoardColumnDef[];
  reloadToken: number;
  onOpen: (service: ClientServiceRecord) => void;
}

export function ClientServiceBoardScroll({
  columns,
  reloadToken,
  onOpen,
}: ClientServiceBoardScrollProps) {
  const { scrollRef, resolvedColumnWidth } = useKanbanHorizontalScroll({
    columnWidth: CLIENT_SERVICE_BOARD_COLUMN_WIDTH,
    columnMarginTotalPx: KANBAN_COLUMN_X_MARGIN_TOTAL_PX,
    layoutKey: columns.length,
    mobileFullWidthColumns: true,
  });

  return (
    <div
      ref={scrollRef}
      className={cn(
        'min-h-0 flex-1 overflow-x-auto overflow-y-hidden pb-2',
        KANBAN_HORIZONTAL_SCROLL_HIDE_SCROLLBAR_CLASS,
        KANBAN_BOARD_MOBILE_SCROLL_CLASS,
      )}
    >
      <div className="flex h-full gap-0" style={{ width: 'max-content' }}>
        {columns.map((column, index) => (
          <ClientServiceBoardColumn
            key={column.key}
            label={column.label}
            hex={column.hex}
            count={column.count}
            sum={column.sum}
            params={column.params}
            reloadToken={reloadToken}
            seed={column.seed}
            onOpen={onOpen}
            showLeftRule={index > 0}
            columnWidth={resolvedColumnWidth}
          />
        ))}
      </div>
    </div>
  );
}
