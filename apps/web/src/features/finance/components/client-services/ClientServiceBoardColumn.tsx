'use client';

import { Loader2 } from 'lucide-react';
import { KanbanColumnMoneyPill } from '@/components/shared';
import { contrastText } from '@/components/shared/kanban/kanban.types';
import { KANBAN_COLUMN_LEFT_RULE_CLASS } from '@/components/shared/kanban/kanban-column-surface';
import { CLIENT_SERVICE_BOARD_COLUMN_WIDTH } from '@/features/finance/constants/client-service-payment-stage';
import type { ClientServiceRecordListParams } from '@/lib/api/client-services';
import { ClientServiceCard } from './ClientServiceCard';
import { InfiniteScrollSentinel } from '@/components/shared/InfiniteScrollSentinel';
import { useClientServiceList, type ClientServiceListSeed } from './use-client-service-list';

interface ClientServiceBoardColumnProps {
  label: string;
  hex: string;
  count: number;
  sum: string;
  params: ClientServiceRecordListParams;
  reloadToken: number;
  onOpen: (id: string) => void;
  showLeftRule?: boolean;
  seed?: ClientServiceListSeed | null;
}

function ClientServiceKanbanColumnHeader({
  label,
  hex,
  count,
}: {
  label: string;
  hex: string;
  count: number;
}) {
  const backgroundColor = hex || '#6B7280';
  const textColor = contrastText(backgroundColor);

  return (
    <div
      className="flex min-h-8 w-full items-center gap-1.5 rounded-md px-3 py-1.5"
      style={{ backgroundColor }}
    >
      <span className="min-w-0 truncate text-sm font-bold" style={{ color: textColor }}>
        {label}
      </span>
      <span
        className="ml-auto shrink-0 text-xs font-medium tabular-nums"
        style={{ color: textColor }}
      >
        {count}
      </span>
    </div>
  );
}

export function ClientServiceBoardColumn({
  label,
  hex,
  count,
  sum,
  params,
  reloadToken,
  onOpen,
  showLeftRule = false,
  seed,
}: ClientServiceBoardColumnProps) {
  const { items, loading, loadingMore, error, hasMore, loadMore } = useClientServiceList(
    params,
    20,
    reloadToken,
    seed,
  );

  return (
    <div
      className="relative mx-2 flex h-full min-h-0 shrink-0 flex-col"
      style={{ width: CLIENT_SERVICE_BOARD_COLUMN_WIDTH }}
    >
      {showLeftRule ? <div className={KANBAN_COLUMN_LEFT_RULE_CLASS} aria-hidden /> : null}

      <div className="group/header mb-3 shrink-0 space-y-2">
        <ClientServiceKanbanColumnHeader label={label} hex={hex} count={count} />
        <KanbanColumnMoneyPill total={sum} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="flex min-h-full min-w-0 flex-col space-y-3 pb-3">
          {items.map((service) => (
            <ClientServiceCard key={service.id} service={service} onOpen={onOpen} />
          ))}

          {error ? <p className="px-1 py-2 text-xs text-red-600">{error}</p> : null}

          {!loading && items.length === 0 && !error ? (
            <div className="border-border rounded-xl border border-dashed p-6 text-center">
              <p className="text-muted-foreground text-xs">No services</p>
            </div>
          ) : null}

          {loading || loadingMore ? (
            <div className="text-muted-foreground flex items-center justify-center py-3">
              <Loader2 className="size-4 animate-spin" aria-hidden />
            </div>
          ) : null}

          <InfiniteScrollSentinel
            onReach={loadMore}
            disabled={loading || loadingMore || !hasMore}
          />
        </div>
      </div>
    </div>
  );
}
