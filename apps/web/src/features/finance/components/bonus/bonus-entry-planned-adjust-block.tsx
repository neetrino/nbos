'use client';

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { NbosMoneyInput } from '@/components/shared/NbosMoneyInput';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { formatAmount } from '@/features/finance/constants/finance';
import type { BonusEntryListRow } from '@/lib/api/bonus';

export type PlannedAdjustFormState = {
  amount: string;
  reason: string;
  title: string;
};

export function BonusEntryPlannedAdjustBlock({
  entry,
  form,
  onChange,
  onSubmit,
  submitting,
  error,
}: {
  entry: BonusEntryListRow;
  form: PlannedAdjustFormState;
  onChange: (next: PlannedAdjustFormState) => void;
  onSubmit: () => void;
  submitting: boolean;
  error: string | null;
}) {
  const original = entry.originalAmount != null ? Number.parseFloat(entry.originalAmount) : null;
  const planned = Number.parseFloat(entry.amount);

  return (
    <div className="border-border bg-muted/40 space-y-3 rounded-lg border p-3">
      <p className="text-foreground text-sm font-medium">Adjust planned amount</p>
      {original != null && original !== planned ? (
        <p className="text-muted-foreground text-xs">
          Original {formatAmount(original)} → current {formatAmount(planned)}
        </p>
      ) : null}
      <NbosMoneyInput
        id={`planned-amt-${entry.id}`}
        label="New planned amount"
        value={form.amount}
        onChange={(amount) => onChange({ ...form, amount })}
      />
      <div className="space-y-1.5">
        <Label htmlFor={`planned-title-${entry.id}`}>Title (optional)</Label>
        <Input
          id={`planned-title-${entry.id}`}
          value={form.title}
          onChange={(e) => onChange({ ...form, title: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`planned-reason-${entry.id}`}>Reason</Label>
        <Textarea
          id={`planned-reason-${entry.id}`}
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
          'Save planned amount'
        )}
      </Button>
    </div>
  );
}
