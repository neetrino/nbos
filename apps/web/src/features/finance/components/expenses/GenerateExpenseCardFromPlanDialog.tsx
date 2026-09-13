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
import { NbosDatePicker } from '@/components/shared/date-picker';
import { Label } from '@/components/ui/label';
import type { ExpensePlan } from '@/lib/api/expense-plans';
import { expensePlansApi } from '@/lib/api/expense-plans';
import { getApiErrorMessage } from '@/lib/api-errors';
import { useTranslations } from 'next-intl';
import { useExpensePlansT } from './expense-plan-message-keys';

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
  const t = useExpensePlansT();
  const tCommon = useTranslations('common');
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
      setError(getApiErrorMessage(caught, t('errors.generateCard')));
    } finally {
      setLoading(false);
    }
  };

  if (!plan) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" forceNestedBackdrop>
        <DialogHeader>
          <DialogTitle>{t('generate.title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          {error ? (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          ) : null}
          <p className="text-muted-foreground text-sm">
            {t('generate.description', { name: plan.name })}
          </p>
          <div>
            <Label htmlFor="card-due">{t('generate.dueDate')}</Label>
            <NbosDatePicker
              id="card-due"
              value={dueDate}
              onChange={setDueDate}
              aria-label={t('generate.dueDateAria')}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tCommon('cancel')}
            </Button>
            <Button type="submit" disabled={loading || !dueDate.trim()}>
              {loading ? t('generate.submitting') : t('generate.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
