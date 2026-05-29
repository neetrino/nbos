'use client';

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { NbosMoneyInput } from '@/components/shared/NbosMoneyInput';
import { Textarea } from '@/components/ui/textarea';
import { formatAmount } from '@/features/finance/constants/finance';
import {
  bonusEntryAutoPayable,
  bonusEntryPayableAdjustment,
  bonusEntryPayableCeiling,
} from '@/features/finance/utils/bonus-entry-payable';
import type { BonusEntryListRow } from '@/lib/api/bonus';

export type PayableAdjustFormState = {
  adjustment: string;
  reason: string;
};

export function BonusEntryPayableAdjustBlock({
  entry,
  form,
  onChange,
  onSubmit,
  submitting,
  error,
}: {
  entry: BonusEntryListRow;
  form: PayableAdjustFormState;
  onChange: (next: PayableAdjustFormState) => void;
  onSubmit: () => void;
  submitting: boolean;
  error: string | null;
}) {
  const autoPayable = bonusEntryAutoPayable(entry);
  const currentAdjustment = bonusEntryPayableAdjustment(entry);
  const payable = bonusEntryPayableCeiling(entry);
  const nextAdjustment = Number.parseFloat(form.adjustment);
  const previewPayable =
    Number.isFinite(nextAdjustment) && Number.isFinite(autoPayable)
      ? Math.max(0, autoPayable + nextAdjustment)
      : payable;

  return (
    <div className="border-border bg-muted/40 space-y-3 rounded-lg border p-3">
      <p className="text-foreground text-sm font-medium">Payable adjustment</p>
      <p className="text-muted-foreground text-xs leading-snug">
        Adds on top of KPI auto payable. Auto {formatAmount(autoPayable)}
        {currentAdjustment !== 0 ? ` · current adjustment ${formatAmount(currentAdjustment)}` : ''}
        {' · '}payable {formatAmount(payable)}
      </p>
      <NbosMoneyInput
        id={`payable-adj-${entry.id}`}
        label="Adjustment (+/−)"
        value={form.adjustment}
        onChange={(adjustment) => onChange({ ...form, adjustment })}
      />
      <p className="text-muted-foreground text-xs">
        Preview payable {formatAmount(previewPayable)}
      </p>
      <div className="space-y-1.5">
        <Label htmlFor={`payable-adj-reason-${entry.id}`}>Reason</Label>
        <Textarea
          id={`payable-adj-reason-${entry.id}`}
          value={form.reason}
          onChange={(e) => onChange({ ...form, reason: e.target.value })}
          rows={2}
          className="resize-y"
        />
      </div>
      {error ? <p className="text-destructive text-xs">{error}</p> : null}
      <Button type="button" size="sm" disabled={submitting} onClick={() => onSubmit()}>
        {submitting ? (
          <>
            <Loader2 className="mr-1.5 size-3.5 animate-spin" aria-hidden />
            Saving
          </>
        ) : (
          'Save payable adjustment'
        )}
      </Button>
    </div>
  );
}
