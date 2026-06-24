'use client';

import { type FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { NbosDatePicker } from '@/components/shared/date-picker';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getApiErrorMessage } from '@/lib/api-errors';
import { expensesApi, type AddExpensePaymentPayload, type Expense } from '@/lib/api/finance';

function todayDateInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

interface AddExpensePaymentDialogProps {
  expenseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Full expense from API (includes ledger fields and synced workflow status). */
  onRecorded: (expense: Expense) => void;
}

export function AddExpensePaymentDialog({
  expenseId,
  open,
  onOpenChange,
  onRecorded,
}: AddExpensePaymentDialogProps) {
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(todayDateInputValue());
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setAmount('');
    setPaymentDate(todayDateInputValue());
    setNotes('');
    setError(null);
  }, [open]);

  const parsed = parseFloat(amount.replace(/\s/g, ''));
  const canSubmit = Boolean(Number.isFinite(parsed) && parsed > 0 && paymentDate.trim());

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const when = new Date(`${paymentDate.trim()}T12:00:00.000Z`);
      const payload: AddExpensePaymentPayload = {
        amount: parsed,
        paymentDate: when.toISOString(),
        notes: notes.trim() ? notes.trim() : undefined,
      };
      const updated = await expensesApi.addPayment(expenseId, payload);
      onRecorded(updated);
      onOpenChange(false);
    } catch (caught) {
      setError(
        getApiErrorMessage(
          caught,
          'Payment could not be recorded. Check the amount and try again.',
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]" forceNestedBackdrop>
        <DialogHeader>
          <DialogTitle>Add payment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          ) : null}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Amount *</Label>
              <Input
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Payment date *</Label>
              <NbosDatePicker
                value={paymentDate}
                onChange={setPaymentDate}
                aria-label="Payment date"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !canSubmit}>
              {loading ? 'Saving…' : 'Record payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
