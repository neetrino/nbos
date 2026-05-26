'use client';

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NbosMoneyInput } from '@/components/shared/NbosMoneyInput';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { BonusReleaseRow } from '@/lib/api/bonus';

export type AdjustFormState = {
  releaseId: string;
  amount: string;
  reason: string;
  approvedById: string;
};

export function BonusEntryReleaseAdjustBlock({
  row,
  form,
  onChange,
  onSubmit,
  submitting,
  error,
}: {
  row: BonusReleaseRow;
  form: AdjustFormState;
  onChange: (next: AdjustFormState) => void;
  onSubmit: () => void;
  submitting: boolean;
  error: string | null;
}) {
  const needsApprover = row.releaseType === 'OVER_FUNDING';
  return (
    <div className="border-border bg-muted/40 mt-2 space-y-3 rounded-lg border p-3">
      {row.releaseType === 'AUTO' ? (
        <p className="text-muted-foreground text-xs">
          Adjusting an AUTO split stores the row as CORRECTION for audit (NBOS bonus pool).
        </p>
      ) : null}
      <NbosMoneyInput
        id={`amt-${row.id}`}
        label="New amount"
        value={form.amount}
        onChange={(amount) => onChange({ ...form, amount })}
      />
      <div className="space-y-1.5">
        <Label htmlFor={`reason-${row.id}`}>Reason</Label>
        <Textarea
          id={`reason-${row.id}`}
          value={form.reason}
          onChange={(e) => onChange({ ...form, reason: e.target.value })}
          rows={2}
          className="resize-y"
        />
      </div>
      {needsApprover ? (
        <div className="space-y-1.5">
          <Label htmlFor={`appr-${row.id}`}>Approver employee id</Label>
          <Input
            id={`appr-${row.id}`}
            value={form.approvedById}
            onChange={(e) => onChange({ ...form, approvedById: e.target.value })}
          />
        </div>
      ) : null}
      {error ? <p className="text-destructive text-xs">{error}</p> : null}
      <Button type="button" size="sm" disabled={submitting} onClick={() => onSubmit()}>
        {submitting ? (
          <>
            <Loader2 className="mr-1.5 size-3.5 animate-spin" aria-hidden />
            Saving
          </>
        ) : (
          'Save adjustment'
        )}
      </Button>
    </div>
  );
}
