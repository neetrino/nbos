'use client';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatAmount } from '@/features/finance/constants/finance';
import type { BonusReleaseRow, BonusReleaseStatus } from '@/lib/api/bonus';

function parseReleaseAmount(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function releaseIsAdjustable(status: BonusReleaseStatus): boolean {
  return status === 'APPROVED' || status === 'DRAFT';
}

export function BonusEntryReleasesSheetTable({
  rows,
  onAdjust,
}: {
  rows: BonusReleaseRow[];
  onAdjust: (r: BonusReleaseRow) => void;
}) {
  return (
    <div className="min-h-0 overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[88px]">Status</TableHead>
            <TableHead className="w-[88px]">Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead className="w-[100px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-muted-foreground text-sm">
                No releases yet for this entry.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="text-xs font-medium">{r.status}</TableCell>
                <TableCell className="text-xs">{r.releaseType}</TableCell>
                <TableCell className="text-sm font-medium">
                  {formatAmount(parseReleaseAmount(r.amount))}
                </TableCell>
                <TableCell className="text-right">
                  {releaseIsAdjustable(r.status) ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => onAdjust(r)}
                    >
                      Adjust
                    </Button>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
