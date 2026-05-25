'use client';

import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatBonusPoolMoney } from '@/features/finance/utils/bonus-pool-amount';
import type { BonusPoolFundingMismatch } from '@/features/finance/utils/bonus-pool-funding-mismatch';

export function BonusPoolFundingMismatchBanner({
  mismatch,
  syncing,
  syncError,
  onReconcile,
}: {
  mismatch: BonusPoolFundingMismatch;
  syncing: boolean;
  syncError: string | null;
  onReconcile: () => void | Promise<void>;
}) {
  if (!mismatch.hasMismatch) return null;

  return (
    <div className="space-y-2 rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm dark:border-amber-900/50 dark:bg-amber-950/30">
      <div className="flex items-start gap-2.5">
        <AlertTriangle
          size={16}
          className="mt-0.5 shrink-0 text-amber-700 dark:text-amber-400"
          aria-hidden
        />
        <div className="min-w-0 space-y-1">
          <p className="text-foreground font-medium">Funding totals are out of sync</p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Client payments total {formatBonusPoolMoney(String(mismatch.paymentsTotal))}, but the
            pool ledger shows {formatBonusPoolMoney(String(mismatch.ledgerReceived))} received.
            Reconcile recalculates Received and Available from live payments.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 pl-6">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={syncing}
          onClick={() => void onReconcile()}
        >
          {syncing ? <Loader2 size={14} className="mr-1.5 animate-spin" aria-hidden /> : null}
          Reconcile funding
        </Button>
        {syncError ? <p className="text-destructive text-xs">{syncError}</p> : null}
      </div>
    </div>
  );
}
