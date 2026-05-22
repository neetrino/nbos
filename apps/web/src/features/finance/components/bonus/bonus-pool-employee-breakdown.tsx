'use client';

import { Loader2 } from 'lucide-react';
import { StatusBadge } from '@/components/shared';
import {
  formatBonusPoolMoney,
  parseBonusPoolAmount,
} from '@/features/finance/utils/bonus-pool-amount';
import type { BonusPoolEmployeeLine } from '@/lib/api/bonus';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const HEAD = 'px-3 py-2 text-xs';
const CELL = 'px-3 py-2.5 text-sm';

function formatBonusTypes(types: string[]): string {
  if (types.length === 0) return '—';
  if (types.length === 1) return types[0] ?? '—';
  return types.join(' · ');
}

function kpiHint(line: BonusPoolEmployeeLine): string | null {
  if (line.kpiGatePassed === false) return 'KPI not passed';
  if (line.kpiGatePassed === true) return 'KPI passed';
  return null;
}

export function BonusPoolEmployeeBreakdown({
  lines,
  loading,
  error,
}: {
  lines: BonusPoolEmployeeLine[];
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Loading employee breakdown…
      </div>
    );
  }
  if (error) {
    return <p className="text-destructive text-sm">{error}</p>;
  }
  if (lines.length === 0) {
    return <p className="text-muted-foreground text-sm">No bonus entries in this pool.</p>;
  }

  return (
    <div className="border-border overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className={HEAD}>Employee</TableHead>
            <TableHead className={HEAD}>Type</TableHead>
            <TableHead className={`${HEAD} text-right`}>Planned</TableHead>
            <TableHead className={`${HEAD} text-right`}>Released</TableHead>
            <TableHead className={`${HEAD} text-right`}>Paid</TableHead>
            <TableHead className={`${HEAD} text-right`}>Remaining</TableHead>
            <TableHead className={`${HEAD} text-right`}>Suggested</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.map((line) => {
            const kpi = kpiHint(line);
            return (
              <TableRow key={line.employeeId}>
                <TableCell className={CELL}>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">{line.employeeName}</span>
                    {line.role ? (
                      <span className="text-muted-foreground text-xs">{line.role}</span>
                    ) : null}
                    {kpi ? (
                      <StatusBadge
                        label={kpi}
                        variant={line.kpiGatePassed ? 'green' : 'amber'}
                        className="mt-0.5 w-fit"
                      />
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className={`${CELL} text-xs`}>
                  {formatBonusTypes(line.bonusTypes)}
                </TableCell>
                <TableCell className={`${CELL} text-right tabular-nums`}>
                  {formatBonusPoolMoney(line.plannedAmount)}
                </TableCell>
                <TableCell className={`${CELL} text-right tabular-nums`}>
                  {formatBonusPoolMoney(line.releasedAmount)}
                </TableCell>
                <TableCell className={`${CELL} text-right tabular-nums`}>
                  {formatBonusPoolMoney(line.paidAmount)}
                </TableCell>
                <TableCell className={`${CELL} text-right tabular-nums`}>
                  {formatBonusPoolMoney(line.remainingAmount)}
                </TableCell>
                <TableCell className={`${CELL} text-right font-medium tabular-nums`}>
                  {formatBonusPoolMoney(line.suggestedReleaseAmount)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
