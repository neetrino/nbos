'use client';

import { CLIENT_SERVICE_BOARD_COLUMN_WIDTH } from '@/features/finance/constants/client-service-payment-stage';
import type { ClientServiceRecordListParams } from '@/lib/api/client-services';
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
  return (
    <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden pb-2">
      <div
        className="flex h-full gap-0"
        style={{ minWidth: `${columns.length * (CLIENT_SERVICE_BOARD_COLUMN_WIDTH + 16)}px` }}
      >
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
          />
        ))}
      </div>
    </div>
  );
}
