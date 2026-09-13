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
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('payroll');
  const tCommon = useTranslations('common');
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
      setCreateError(getApiErrorMessage(caught, t('create.createError')));
    } finally {
      setCreating(false);
    }
  }, [month, seedLines, onCreated, onOpenChange, t]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('create.title')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="payroll-month">{t('create.monthLabel')}</Label>
            <NbosMonthPicker
              id="payroll-month"
              value={month}
              onChange={setMonth}
              aria-label={t('create.monthAria')}
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={seedLines}
              onChange={(e) => setSeedLines(e.target.checked)}
              className="border-input size-4 rounded border"
            />
            {t('create.seedLines')}
          </label>
          {createError ? <p className="text-destructive text-sm">{createError}</p> : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {tCommon('cancel')}
          </Button>
          <Button type="button" disabled={creating} onClick={() => void submitCreate()}>
            {creating ? tCommon('creating') : tCommon('create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
