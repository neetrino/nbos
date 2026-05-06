'use client';

import { Loader2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { BonusEntryReleaseAdjustBlock } from '@/features/finance/components/bonus/bonus-entry-release-adjust-block';
import { BonusEntryReleasesSheetTable } from '@/features/finance/components/bonus/bonus-entry-releases-sheet-table';
import { useBonusEntryReleasesLedger } from '@/features/finance/components/bonus/use-bonus-entry-releases-ledger';
import {
  employeeDisplayName,
  parseBonusAmount,
} from '@/features/finance/components/bonus/bonus-board-widgets';
import { formatAmount } from '@/features/finance/constants/finance';
import type { BonusEntryListRow } from '@/lib/api/bonus';

export function BonusEntryReleasesSheet({
  entry,
  open,
  onOpenChange,
  onAfterPatch,
}: {
  entry: BonusEntryListRow | null;
  open: boolean;
  onOpenChange: (next: boolean) => void;
  onAfterPatch: () => void;
}) {
  const ledger = useBonusEntryReleasesLedger(entry, open, onAfterPatch);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Bonus releases</SheetTitle>
          <SheetDescription>
            {entry
              ? `${employeeDisplayName(entry.employee)} · ${formatAmount(parseBonusAmount(entry.amount))} planned`
              : 'Select a bonus entry from the board.'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-6">
          {ledger.loading ? (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Loading ledger…
            </div>
          ) : null}
          {ledger.loadError ? <p className="text-destructive text-sm">{ledger.loadError}</p> : null}

          {!ledger.loading && !ledger.loadError && entry ? (
            <BonusEntryReleasesSheetTable rows={ledger.rows} onAdjust={ledger.startAdjust} />
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
      </SheetContent>
    </Sheet>
  );
}
