'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { NbosMonthPicker } from '@/components/shared/date-picker';
import { getApiErrorMessage } from '@/lib/api-errors';
import { payrollRunsApi } from '@/lib/api/payroll-runs';

export interface PayrollRunsCreateRunDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMonth: string;
  onCreated: () => void | Promise<void>;
}

export function PayrollRunsCreateRunDialog({
  open,
  onOpenChange,
  defaultMonth,
  onCreated,
}: PayrollRunsCreateRunDialogProps) {
  const [month, setMonth] = useState(defaultMonth);
  const [seedLines, setSeedLines] = useState(true);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMonth(defaultMonth);
    setSeedLines(true);
    setCreateError(null);
  }, [open, defaultMonth]);

  const submitCreate = useCallback(async () => {
    setCreating(true);
    setCreateError(null);
    try {
      await payrollRunsApi.create({ payrollMonth: month, seedLines });
      onOpenChange(false);
      await onCreated();
    } catch (caught) {
      setCreateError(getApiErrorMessage(caught, 'Payroll run could not be created.'));
    } finally {
      setCreating(false);
    }
  }, [month, seedLines, onCreated, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New payroll run</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="payroll-month">Payroll month (YYYY-MM)</Label>
            <NbosMonthPicker
              id="payroll-month"
              value={month}
              onChange={setMonth}
              aria-label="Payroll month"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={seedLines}
              onChange={(e) => setSeedLines(e.target.checked)}
              className="border-input size-4 rounded border"
            />
            Seed salary lines from active employees (uses current base salary)
          </label>
          {createError ? <p className="text-destructive text-sm">{createError}</p> : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={creating} onClick={() => void submitCreate()}>
            {creating ? 'Creating…' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
