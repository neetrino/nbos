'use client';

import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorState, LoadingState } from '@/components/shared';
import { resolveKanbanStageHex } from '@/components/shared/kanban/kanban-stage-hex';
import { clientServiceStageHex } from '@/features/finance/constants/client-service-payment-stage';
import type { ClientServiceRecord, ClientServiceRecordListParams } from '@/lib/api/client-services';
import { ClientServiceBoardScroll } from './ClientServiceBoardScroll';
import { useClientServiceBoard } from './use-client-service-board';

interface ClientServiceMonthsBoardViewProps {
  baseParams: ClientServiceRecordListParams;
  year: number;
  onYearChange: (year: number) => void;
  reloadToken: number;
  onOpen: (service: ClientServiceRecord) => void;
}

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const MONTH_HEX = resolveKanbanStageHex('bg-cyan-600') ?? '#0891B2';
const CURRENT_MONTH_HEX = clientServiceStageHex('active');

function isCurrentMonthColumn(year: number, month: number): boolean {
  const now = new Date();
  return year === now.getFullYear() && month === now.getMonth();
}

function monthRange(year: number, month: number): { from: string; to: string } {
  const from = new Date(Date.UTC(year, month, 1));
  const to = new Date(Date.UTC(year, month + 1, 1) - 1);
  return { from: from.toISOString(), to: to.toISOString() };
}

export function ClientServiceMonthsBoardView({
  baseParams,
  year,
  onYearChange,
  reloadToken,
  onOpen,
}: ClientServiceMonthsBoardViewProps) {
  const { board, loading, error } = useClientServiceBoard({
    view: 'months',
    baseParams,
    year,
    reloadToken,
  });

  const columns = useMemo(() => {
    const byKey = new Map(board?.columns.map((column) => [column.key, column]));
    return MONTH_LABELS.map((label, month) => {
      const key = `${year}-${month}`;
      const column = byKey.get(key);
      const { from, to } = monthRange(year, month);
      return {
        key,
        label,
        hex: isCurrentMonthColumn(year, month) ? CURRENT_MONTH_HEX : MONTH_HEX,
        count: column?.count ?? 0,
        sum: column?.sum ?? '0',
        params: { ...baseParams, renewalFrom: from, renewalTo: to },
        seed: column ? { items: column.items, total: column.meta.total } : { items: [], total: 0 },
      };
    });
  }, [baseParams, board, year]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => onYearChange(year - 1)}
          aria-label="Previous year"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </Button>
        <span className="min-w-16 text-center text-sm font-semibold tabular-nums">{year}</span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => onYearChange(year + 1)}
          aria-label="Next year"
        >
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState description={error} />
      ) : (
        <ClientServiceBoardScroll columns={columns} reloadToken={reloadToken} onOpen={onOpen} />
      )}
    </div>
  );
}
