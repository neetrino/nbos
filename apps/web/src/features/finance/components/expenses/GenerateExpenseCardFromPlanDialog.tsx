'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ExpensePlan } from '@/lib/api/expense-plans';
import { expensePlansApi } from '@/lib/api/expense-plans';
import { getApiErrorMessage } from '@/lib/api-errors';

interface GenerateExpenseCardFromPlanDialogProps {
  plan: ExpensePlan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerated: () => void;
}

function toDateInputValue(iso: string | null): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

export function GenerateExpenseCardFromPlanDialog({
  plan,
  open,
  onOpenChange,
  onGenerated,
}: GenerateExpenseCardFromPlanDialogProps) {
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !plan) return;
    setDueDate(toDateInputValue(plan.nextDueDate));
    setError(null);
  }, [open, plan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan) return;
    setLoading(true);
    setError(null);
    try {
      await expensePlansApi.generateCard(plan.id, {
        dueDate: dueDate.trim() ? dueDate : null,
      });
      onGenerated();
      onOpenChange(false);
    } catch (caught) {
      setError(
        getApiErrorMessage(
          caught,
          'Could not generate expense from plan. Check dates and try again.',
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  if (!plan) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate expense card</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          {error ? (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          ) : null}
          <p className="text-muted-foreground text-sm">
            Creates a Board expense linked to{' '}
            <span className="text-foreground font-medium">{plan.name}</span>. Recurring plans update
            the plan&apos;s next due date after generation.
          </p>
          <div>
            <Label htmlFor="card-due">Due date</Label>
            <Input
              id="card-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !dueDate.trim()}>
              {loading ? 'Generating…' : 'Generate'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
