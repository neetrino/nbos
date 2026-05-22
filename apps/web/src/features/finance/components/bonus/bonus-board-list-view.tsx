'use client';

import { Gift } from 'lucide-react';
import { EmptyState } from '@/components/shared';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BONUS_BOARD_TYPE_CONFIG } from '@/features/finance/constants/bonus-board';
import {
  employeeDisplayName,
  parseBonusAmount,
  projectLabel,
} from '@/features/finance/components/bonus/bonus-board-widgets';
import { formatAmount } from '@/features/finance/constants/finance';
import type { BonusEntryListRow } from '@/lib/api/bonus';

export function BonusBoardListView({
  rows,
  onOpenReleases,
}: {
  rows: BonusEntryListRow[];
  onOpenReleases: (entry: BonusEntryListRow) => void;
}) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Gift}
        title="No matching entries"
        description="Adjust search or filters to see bonus lines."
        action={null}
      />
    );
  }

  return (
    <div className="border-border overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Order</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payroll month</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const typeCfg = BONUS_BOARD_TYPE_CONFIG[row.type];
            return (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{employeeDisplayName(row.employee)}</TableCell>
                <TableCell
                  className="max-w-[10rem] truncate"
                  title={projectLabel(row.project) ?? ''}
                >
                  {projectLabel(row.project) ?? '—'}
                </TableCell>
                <TableCell>{row.order.code}</TableCell>
                <TableCell>
                  <span className={`rounded-md px-1.5 py-0.5 text-[10px] ${typeCfg.color}`}>
                    {typeCfg.label}
                  </span>
                </TableCell>
                <TableCell className="text-xs">{row.status}</TableCell>
                <TableCell className="tabular-nums">{row.payoutMonth ?? '—'}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatAmount(parseBonusAmount(row.amount))}
                </TableCell>
                <TableCell>
                  <button
                    type="button"
                    onClick={() => onOpenReleases(row)}
                    className="text-primary text-sm font-medium hover:underline"
                  >
                    Releases
                  </button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
