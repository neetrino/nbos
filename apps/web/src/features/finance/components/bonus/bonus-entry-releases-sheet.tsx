'use client';

import { useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { EntityDetailSheetContent } from '@/components/shared';
import { Sheet, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { BonusEntryReleaseAdjustBlock } from '@/features/finance/components/bonus/bonus-entry-release-adjust-block';
import { BonusEntryReleasesSheetSummary } from '@/features/finance/components/bonus/bonus-entry-releases-sheet-summary';
import { BonusEntryReleasesSheetTable } from '@/features/finance/components/bonus/bonus-entry-releases-sheet-table';
import { useBonusEntryReleasesLedger } from '@/features/finance/components/bonus/use-bonus-entry-releases-ledger';
import {
  employeeDisplayName,
  parseBonusAmount,
} from '@/features/finance/components/bonus/bonus-board-widgets';
import { formatAmount } from '@/features/finance/constants/finance';
import { computeBonusEntryReleaseTotals } from '@/features/finance/utils/bonus-entry-release-totals';
import type { BonusEntryListRow } from '@/lib/api/bonus';

export function BonusEntryReleasesSheet({
  entry,
  open,
  onOpenChange,
  onAfterPatch,
  forceNestedBackdrop,
}: {
  entry: BonusEntryListRow | null;
  open: boolean;
  onOpenChange: (next: boolean) => void;
  onAfterPatch: () => void;
  forceNestedBackdrop?: boolean;
}) {
  const ledger = useBonusEntryReleasesLedger(entry, open, onAfterPatch);

  const totals = useMemo(() => {
    if (!entry) {
      return computeBonusEntryReleaseTotals('0', []);
    }
    return computeBonusEntryReleaseTotals(entry.amount, ledger.rows);
  }, [entry, ledger.rows]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <EntityDetailSheetContent
        open={open}
        layout="auxiliary"
        className="gap-0"
        forceNestedBackdrop={forceNestedBackdrop}
      >
        <SheetHeader>
          <SheetTitle>Bonus entry</SheetTitle>
          <SheetDescription>
            {entry
              ? `${employeeDisplayName(entry.employee)} · ${formatAmount(parseBonusAmount(entry.amount))} planned`
              : 'Select a bonus from the board.'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-6">
          {entry ? (
            <BonusEntryReleasesSheetSummary
              entry={entry}
              totals={totals}
              releaseCount={ledger.rows.length}
            />
          ) : null}

          {ledger.loading ? (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Loading releases…
            </div>
          ) : null}

          {ledger.loadError ? <p className="text-destructive text-sm">{ledger.loadError}</p> : null}

          {!ledger.loading && !ledger.loadError && entry ? (
            <section aria-label="Release ledger" className="space-y-2">
              <h3 className="text-foreground text-sm font-semibold">Release ledger</h3>
              <BonusEntryReleasesSheetTable rows={ledger.rows} onAdjust={ledger.startAdjust} />
            </section>
          ) : null}

          {ledger.adjustTarget && ledger.form && entry ? (
            <BonusEntryReleaseAdjustBlock
              row={ledger.adjustTarget}
              form={ledger.form}
              onChange={ledger.setForm}
              onSubmit={() => void ledger.submitAdjust()}
              submitting={ledger.submitting}
              error={ledger.submitError}
            />
          ) : null}
        </div>
      </EntityDetailSheetContent>
    </Sheet>
  );
}
