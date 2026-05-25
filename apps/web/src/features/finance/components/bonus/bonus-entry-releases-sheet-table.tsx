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
import { StatusBadge } from '@/components/shared';
import { BONUS_RELEASE_TYPE_UI } from '@/features/finance/constants/bonus-release-type-ui';
import {
  BONUS_RELEASE_STATUS_LABEL,
  BONUS_RELEASE_STATUS_VARIANT,
  bonusReleaseIsAdjustable,
} from '@/features/finance/constants/bonus-release-status-ui';
import { formatAmount } from '@/features/finance/constants/finance';
import type { BonusReleaseRow } from '@/lib/api/bonus';

function parseReleaseAmount(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function formatReleaseDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function BonusEntryReleasesSheetTable({
  rows,
  onAdjust,
}: {
  rows: BonusReleaseRow[];
  onAdjust: (r: BonusReleaseRow) => void;
}) {
  if (rows.length === 0) {
    return (
      <div className="border-border rounded-xl border border-dashed px-4 py-8 text-center">
        <p className="text-muted-foreground text-sm">No release rows yet.</p>
        <p className="text-muted-foreground mt-1 text-xs">
          Product pool auto-release or manual approval creates rows here.
        </p>
      </div>
    );
  }

  return (
    <div className="border-border min-h-0 overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className="w-[88px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => {
            const typeUi = BONUS_RELEASE_TYPE_UI[r.releaseType];
            const adjustable = bonusReleaseIsAdjustable(r.status);
            return (
              <TableRow key={r.id}>
                <TableCell>
                  <StatusBadge
                    label={BONUS_RELEASE_STATUS_LABEL[r.status]}
                    variant={BONUS_RELEASE_STATUS_VARIANT[r.status]}
                    className="text-[10px]"
                  />
                </TableCell>
                <TableCell>
                  <StatusBadge
                    label={typeUi.label}
                    variant={typeUi.variant}
                    className="text-[10px]"
                  />
                  {typeUi.isWarning && r.reason ? (
                    <p className="text-muted-foreground mt-1 max-w-[12rem] truncate text-[10px]">
                      {r.reason}
                    </p>
                  ) : null}
                </TableCell>
                <TableCell className="text-right text-sm font-semibold tabular-nums">
                  {formatAmount(parseReleaseAmount(r.amount))}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs tabular-nums">
                  {formatReleaseDate(r.updatedAt)}
                </TableCell>
                <TableCell className="text-right">
                  {adjustable ? (
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
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
