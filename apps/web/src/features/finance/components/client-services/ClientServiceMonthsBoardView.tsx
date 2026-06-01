'use client';

import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { resolveKanbanStageHex } from '@/components/shared/kanban/kanban-stage-hex';
import type { ClientServiceRecordListParams, ClientServiceStats } from '@/lib/api/client-services';
import { ClientServiceBoardScroll } from './ClientServiceBoardScroll';

interface ClientServiceMonthsBoardViewProps {
  baseParams: ClientServiceRecordListParams;
  stats: ClientServiceStats | null;
  year: number;
  onYearChange: (year: number) => void;
  reloadToken: number;
  onOpen: (id: string) => void;
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

function monthRange(year: number, month: number): { from: string; to: string } {
  const from = new Date(Date.UTC(year, month, 1));
  const to = new Date(Date.UTC(year, month + 1, 1) - 1);
  return { from: from.toISOString(), to: to.toISOString() };
}

export function ClientServiceMonthsBoardView({
  baseParams,
  stats,
  year,
  onYearChange,
  reloadToken,
  onOpen,
}: ClientServiceMonthsBoardViewProps) {
  const columns = useMemo(
    () =>
      MONTH_LABELS.map((label, month) => {
        const stat = stats?.byMonth.find((entry) => entry.month === month);
        const { from, to } = monthRange(year, month);
        return {
          key: `${year}-${month}`,
          label,
          hex: MONTH_HEX,
          count: stat?.count ?? 0,
          sum: stat?.sum ?? '0',
          params: { ...baseParams, renewalFrom: from, renewalTo: to },
        };
      }),
    [baseParams, stats, year],
  );

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

      <ClientServiceBoardScroll columns={columns} reloadToken={reloadToken} onOpen={onOpen} />
    </div>
  );
}
