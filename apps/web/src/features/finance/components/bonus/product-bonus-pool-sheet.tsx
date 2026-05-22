'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { EntityDetailSheetContent, StatusBadge } from '@/components/shared';
import { Sheet, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DetailSheetSection } from '@/components/shared/DetailSheetSection';
import { bonusBoardHref } from '@/features/finance/constants/bonus-board-url';
import {
  bonusPoolHasOverFunding,
  bonusPoolSheetStatusUi,
} from '@/features/finance/constants/bonus-pool-status-ui';
import {
  employeeDisplayName,
  parseBonusAmount,
} from '@/features/finance/components/bonus/bonus-board-widgets';
import { formatAmount } from '@/features/finance/constants/finance';
import { formatBonusPoolMoney } from '@/features/finance/utils/bonus-pool-amount';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  fetchAllBonusListRows,
  type BonusEntryListRow,
  type BonusProductPoolRow,
} from '@/lib/api/bonus';

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

  const loadEntries = useCallback(async (orderId: string) => {
    setEntriesLoading(true);
    setEntriesError(null);
    try {
      const rows = await fetchAllBonusListRows({ orderId });
      setEntries(rows);
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
    void loadEntries(pool.anchorOrderId);
  }, [loadEntries, open, pool]);

  const statusUi = pool ? bonusPoolSheetStatusUi(pool) : null;

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
            <DetailSheetSection title="Order ledger">
              {statusUi ? (
                <StatusBadge label={statusUi.label} variant={statusUi.variant} />
              ) : (
                <span className="text-muted-foreground text-sm">No ledger status</span>
              )}
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Entries</dt>
                <dd className="text-right tabular-nums">{pool.entryCount}</dd>
                <dt className="text-muted-foreground">Received</dt>
                <dd className="text-right tabular-nums">
                  {formatBonusPoolMoney(pool.ledgerReceivedAmount)}
                </dd>
                <dt className="text-muted-foreground">Planned</dt>
                <dd className="text-right tabular-nums">
                  {formatBonusPoolMoney(pool.ledgerPlannedAmount)}
                </dd>
                <dt className="text-muted-foreground">Released</dt>
                <dd className="text-right tabular-nums">
                  {formatBonusPoolMoney(pool.ledgerReleasedAmount)}
                </dd>
                <dt className="text-muted-foreground">Remaining</dt>
                <dd className="text-right tabular-nums">
                  {formatBonusPoolMoney(pool.ledgerRemainingAmount)}
                </dd>
                <dt className="text-muted-foreground">Available funding</dt>
                <dd className="text-right tabular-nums">
                  {formatBonusPoolMoney(pool.ledgerAvailableFunding)}
                </dd>
                <dt className="text-muted-foreground">Over funding</dt>
                <dd className="text-right tabular-nums">
                  {formatBonusPoolMoney(pool.ledgerOverFundingAmount)}
                </dd>
                <dt className="text-muted-foreground">Pipeline</dt>
                <dd className="text-right tabular-nums">
                  {formatBonusPoolMoney(pool.sumPipelineAmount)}
                </dd>
                <dt className="text-muted-foreground">Paid (entries)</dt>
                <dd className="text-right tabular-nums">
                  {formatBonusPoolMoney(pool.sumPaidAmount)}
                </dd>
              </dl>
              {bonusPoolHasOverFunding(pool) ? (
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

            <DetailSheetSection title="Bonus entries (this order)">
              {entriesLoading ? (
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Loading entries…
                </div>
              ) : null}
              {entriesError ? <p className="text-destructive text-sm">{entriesError}</p> : null}
              {!entriesLoading && !entriesError && entries.length === 0 ? (
                <p className="text-muted-foreground text-sm">No bonus entries on this order.</p>
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
