'use client';

import { useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EntityDetailSheetContent } from '@/components/shared';
import { Sheet, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { BonusEntryAuditPanel } from '@/features/finance/components/bonus/bonus-entry-audit-panel';
import { BonusEntryPlannedAdjustBlock } from '@/features/finance/components/bonus/bonus-entry-planned-adjust-block';
import { BonusEntryPayableAdjustBlock } from '@/features/finance/components/bonus/bonus-entry-payable-adjust-block';
import { BonusEntryReleaseAdjustBlock } from '@/features/finance/components/bonus/bonus-entry-release-adjust-block';
import { useBonusEntryPlannedAdjust } from '@/features/finance/components/bonus/use-bonus-entry-planned-adjust';
import { useBonusEntryPayableAdjust } from '@/features/finance/components/bonus/use-bonus-entry-payable-adjust';
import { BonusEntryReleasesSheetSummary } from '@/features/finance/components/bonus/bonus-entry-releases-sheet-summary';
import { BonusEntryReleasesSheetTable } from '@/features/finance/components/bonus/bonus-entry-releases-sheet-table';
import { useBonusEntryReleasesLedger } from '@/features/finance/components/bonus/use-bonus-entry-releases-ledger';
import {
  employeeDisplayName,
  parseBonusAmount,
} from '@/features/finance/components/bonus/bonus-board-widgets';
import { formatAmount } from '@/features/finance/constants/finance';
import { computeBonusEntryReleaseTotals } from '@/features/finance/utils/bonus-entry-release-totals';
import { bonusEntryPayableCeiling } from '@/features/finance/utils/bonus-entry-payable';
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
  const plannedAdjust = useBonusEntryPlannedAdjust(entry, open, onAfterPatch);
  const payableAdjust = useBonusEntryPayableAdjust(entry, open, onAfterPatch);

  const totals = useMemo(() => {
    if (!entry) {
      return computeBonusEntryReleaseTotals('0', []);
    }
    return computeBonusEntryReleaseTotals(String(bonusEntryPayableCeiling(entry)), ledger.rows);
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

          {entry && !plannedAdjust.editing ? (
            <Button type="button" variant="outline" size="sm" onClick={plannedAdjust.startEdit}>
              Adjust planned amount
            </Button>
          ) : null}

          {entry && !payableAdjust.editing ? (
            <Button type="button" variant="outline" size="sm" onClick={payableAdjust.startEdit}>
              Payable adjustment
            </Button>
          ) : null}

          {payableAdjust.editing && payableAdjust.form && entry ? (
            <BonusEntryPayableAdjustBlock
              entry={entry}
              form={payableAdjust.form}
              onChange={payableAdjust.setForm}
              onSubmit={() => void payableAdjust.submit()}
              submitting={payableAdjust.submitting}
              error={payableAdjust.submitError}
            />
          ) : null}

          {plannedAdjust.editing && plannedAdjust.form && entry ? (
            <BonusEntryPlannedAdjustBlock
              entry={entry}
              form={plannedAdjust.form}
              onChange={plannedAdjust.setForm}
              onSubmit={() => void plannedAdjust.submit()}
              submitting={plannedAdjust.submitting}
              error={plannedAdjust.submitError}
            />
          ) : null}

          {entry ? (
            <section aria-label="Audit trail" className="space-y-2">
              <h3 className="text-foreground text-sm font-semibold">Audit trail</h3>
              <BonusEntryAuditPanel bonusEntryId={entry.id} />
            </section>
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
