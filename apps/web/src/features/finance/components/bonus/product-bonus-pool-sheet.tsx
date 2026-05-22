'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { EntityDetailSheetContent, StatusBadge } from '@/components/shared';
import { Sheet, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DetailSheetSection } from '@/components/shared/DetailSheetSection';
import { bonusBoardHref } from '@/features/finance/constants/bonus-board-url';
import { formatAmount } from '@/features/finance/constants/finance';
import {
  employeeDisplayName,
  parseBonusAmount,
} from '@/features/finance/components/bonus/bonus-board-widgets';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  fetchAllBonusListRows,
  type BonusEntryListRow,
  type BonusProductPoolRow,
} from '@/lib/api/bonus';

function parsePoolAmount(value: string | null): number {
  if (value == null) return 0;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function poolFundingVariant(status: string | null): 'green' | 'amber' | 'red' | 'gray' {
  const s = status?.toUpperCase() ?? '';
  if (s.includes('OVER') || s.includes('EXCEEDED')) return 'red';
  if (s.includes('PARTIAL') || s.includes('LOW')) return 'amber';
  if (s.includes('FUNDED') || s.includes('OK')) return 'green';
  return 'gray';
}

export function ProductBonusPoolSheet({
  pool,
  open,
  onOpenChange,
}: {
  pool: BonusProductPoolRow | null;
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  const [entries, setEntries] = useState<BonusEntryListRow[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [entriesError, setEntriesError] = useState<string | null>(null);

  const loadEntries = useCallback(async (projectId: string) => {
    setEntriesLoading(true);
    setEntriesError(null);
    try {
      const rows = await fetchAllBonusListRows({ projectId });
      setEntries(rows.slice(0, 12));
    } catch (caught) {
      setEntries([]);
      setEntriesError(getApiErrorMessage(caught, 'Bonus entries could not be loaded.'));
    } finally {
      setEntriesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open || !pool) {
      setEntries([]);
      setEntriesError(null);
      return;
    }
    void loadEntries(pool.projectId);
  }, [loadEntries, open, pool]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <EntityDetailSheetContent open={open} layout="auxiliary" className="gap-0">
        <SheetHeader>
          <SheetTitle>{pool?.poolName ?? 'Product bonus pool'}</SheetTitle>
          <SheetDescription>
            {pool
              ? `${pool.poolKind} · ${pool.projectCode} · ${pool.orderCode}`
              : 'Select a pool row to inspect ledger and entries.'}
          </SheetDescription>
        </SheetHeader>

        {pool ? (
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-6">
            <DetailSheetSection title="Roll-up">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Entries</dt>
                <dd className="text-right tabular-nums">{pool.entryCount}</dd>
                <dt className="text-muted-foreground">Pipeline</dt>
                <dd className="text-right tabular-nums">
                  {formatAmount(parsePoolAmount(pool.sumPipelineAmount))}
                </dd>
                <dt className="text-muted-foreground">Paid</dt>
                <dd className="text-right tabular-nums">
                  {formatAmount(parsePoolAmount(pool.sumPaidAmount))}
                </dd>
                <dt className="text-muted-foreground">Total</dt>
                <dd className="text-right font-medium tabular-nums">
                  {formatAmount(parsePoolAmount(pool.sumTotalAmount))}
                </dd>
              </dl>
            </DetailSheetSection>

            <DetailSheetSection title="Order ledger">
              <div className="flex flex-wrap items-center gap-2">
                {pool.ledgerPoolStatus ? (
                  <StatusBadge
                    label={pool.ledgerPoolStatus}
                    variant={poolFundingVariant(pool.ledgerPoolStatus)}
                  />
                ) : (
                  <span className="text-muted-foreground text-sm">No ledger status</span>
                )}
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Planned</dt>
                <dd className="text-right tabular-nums">
                  {pool.ledgerPlannedAmount != null
                    ? formatAmount(parsePoolAmount(pool.ledgerPlannedAmount))
                    : '—'}
                </dd>
                <dt className="text-muted-foreground">Released</dt>
                <dd className="text-right tabular-nums">
                  {pool.ledgerReleasedAmount != null
                    ? formatAmount(parsePoolAmount(pool.ledgerReleasedAmount))
                    : '—'}
                </dd>
                <dt className="text-muted-foreground">Remaining</dt>
                <dd className="text-right tabular-nums">
                  {pool.ledgerRemainingAmount != null
                    ? formatAmount(parsePoolAmount(pool.ledgerRemainingAmount))
                    : '—'}
                </dd>
                <dt className="text-muted-foreground">Available funding</dt>
                <dd className="text-right tabular-nums">
                  {pool.ledgerAvailableFunding != null
                    ? formatAmount(parsePoolAmount(pool.ledgerAvailableFunding))
                    : '—'}
                </dd>
              </dl>
              {pool.ledgerPoolStatus?.toUpperCase().includes('OVER') ? (
                <p className="text-destructive mt-2 text-xs">
                  Over-funding on this order pool — review releases before payroll attach.
                </p>
              ) : null}
            </DetailSheetSection>

            <DetailSheetSection title="Traceability">
              <Link
                href={`/projects/${pool.projectId}`}
                className="text-primary text-sm font-medium hover:underline"
              >
                {pool.projectCode} · {pool.projectName}
              </Link>
              <p className="text-muted-foreground mt-1 font-mono text-xs">{pool.poolKey}</p>
              <Link
                href={bonusBoardHref(pool.projectId)}
                className="text-primary mt-3 inline-block text-sm font-medium hover:underline"
              >
                Open bonus board (this project)
              </Link>
            </DetailSheetSection>

            <DetailSheetSection title="Recent entries">
              {entriesLoading ? (
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Loading entries…
                </div>
              ) : null}
              {entriesError ? <p className="text-destructive text-sm">{entriesError}</p> : null}
              {!entriesLoading && !entriesError && entries.length === 0 ? (
                <p className="text-muted-foreground text-sm">No bonus entries on this project.</p>
              ) : null}
              {!entriesLoading && entries.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {entries.map((row) => (
                    <li
                      key={row.id}
                      className="border-border flex justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
                    >
                      <span>{employeeDisplayName(row.employee)}</span>
                      <span className="font-medium tabular-nums">
                        {formatAmount(parseBonusAmount(row.amount))}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </DetailSheetSection>
          </div>
        ) : null}
      </EntityDetailSheetContent>
    </Sheet>
  );
}
