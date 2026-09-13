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
import { NbosDatePicker } from '@/components/shared/date-picker';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FinanceProductCredentialFields } from '@/features/finance/components/FinanceProductCredentialFields';
import { EXPENSE_CATEGORIES } from '@/features/finance/constants/finance';
import { EXPENSE_FREQUENCIES } from '@/features/finance/components/expenses/edit-expense-dialog-constants';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  expensePlansApi,
  type CreateExpensePlanPayload,
  type ExpensePlan,
} from '@/lib/api/expense-plans';
import { projectDisplayName } from '@/lib/format/project-product-display';
import {
  EMPTY_EXPENSE_PLAN_FORM,
  expensePlanToFormState,
  type ExpensePlanFormState,
} from '@/features/finance/utils/expense-plan-form-state';
import { useTranslations } from 'next-intl';
import {
  translateExpensePlanCategory,
  translateExpensePlanFrequency,
  useExpensePlansT,
} from './expense-plan-message-keys';

const PLAN_CATEGORY_OPTIONS = EXPENSE_CATEGORIES;

interface CreateExpensePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, dialog updates this plan instead of creating a new one. */
  planToEdit?: ExpensePlan | null;
  /** Pre-filled fields when opening from a client service sheet. */
  initialForm?: Partial<ExpensePlanFormState>;
  /** Custom submit instead of default `expensePlansApi.create`. */
  submitOverride?: (form: ExpensePlanFormState) => Promise<ExpensePlan>;
  forceNestedBackdrop?: boolean;
  onCreated?: (plan: ExpensePlan) => void;
  onUpdated?: (plan: ExpensePlan) => void;
}

export function CreateExpensePlanDialog({
  open,
  onOpenChange,
  planToEdit = null,
  initialForm,
  submitOverride,
  forceNestedBackdrop = false,
  onCreated,
  onUpdated,
}: CreateExpensePlanDialogProps) {
  const t = useExpensePlansT();
  const tCommon = useTranslations('common');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<ExpensePlanFormState>({ ...EMPTY_EXPENSE_PLAN_FORM });
  const [productLabel, setProductLabel] = useState<string | null>(null);
  const [credentialLabel, setCredentialLabel] = useState<string | null>(null);

  const initialFormKey = JSON.stringify(initialForm ?? {});

  useEffect(() => {
    if (!open) return;
    setFormError(null);
    if (planToEdit) {
      setForm(expensePlanToFormState(planToEdit));
      setProductLabel(planToEdit.product?.name ?? null);
      setCredentialLabel(planToEdit.credential?.name ?? null);
    } else {
      setForm({ ...EMPTY_EXPENSE_PLAN_FORM, ...initialForm });
      setProductLabel(null);
      setCredentialLabel(null);
    }
  }, [open, planToEdit, initialFormKey, initialForm]);

  const parsedAmount = parseFloat(form.amount.replace(/\s/g, ''));
  const canSubmit = Boolean(form.name.trim()) && Number.isFinite(parsedAmount) && parsedAmount > 0;
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setFormError(null);
    const payload: CreateExpensePlanPayload = {
      name: form.name.trim(),
      category: form.category,
      amount: parsedAmount,
      frequency: form.frequency,
      nextDueDate: form.nextDueDate.trim() ? form.nextDueDate : null,
      productId: form.productId.trim() || null,
      credentialId: form.credentialId.trim() || null,
      autoGenerate: form.autoGenerate,
      notes: form.notes.trim() || null,
    };
    const isEdit = Boolean(planToEdit);
    try {
      if (submitOverride && !isEdit) {
        const created = await submitOverride(form);
        onCreated?.(created);
      } else if (isEdit && planToEdit) {
        const updated = await expensePlansApi.update(planToEdit.id, payload);
        onUpdated?.(updated);
      } else {
        const created = await expensePlansApi.create(payload);
        onCreated?.(created);
      }
      onOpenChange(false);
    } catch (caught) {
      setFormError(
        getApiErrorMessage(
          caught,
          isEdit ? t('errors.save') : t('errors.create'),
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" forceNestedBackdrop={forceNestedBackdrop}>
        <DialogHeader>
          <DialogTitle>{planToEdit ? t('create.editTitle') : t('create.title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          {formError ? (
            <p className="text-destructive text-sm" role="alert">
              {formError}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label>{t('create.name')}</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={t('create.namePlaceholder')}
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t('create.category')}</Label>
              <Select
                value={form.category}
                onValueChange={(v) => {
                  if (v) setForm({ ...form, category: v });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLAN_CATEGORY_OPTIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {translateExpensePlanCategory(t, c.value, c.label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('create.amount')}</Label>
              <Input
                inputMode="decimal"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder={t('create.amountPlaceholder')}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t('create.frequency')}</Label>
              <Select
                value={form.frequency}
                onValueChange={(v) => {
                  if (v) setForm({ ...form, frequency: v });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_FREQUENCIES.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {translateExpensePlanFrequency(t, f.value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('create.nextDue')}</Label>
              <NbosDatePicker
                value={form.nextDueDate}
                onChange={(nextDueDate) => setForm({ ...form, nextDueDate })}
                aria-label={t('create.nextDueAria')}
              />
            </div>
          </div>
          <FinanceProductCredentialFields
            productId={form.productId || null}
            productLabel={productLabel}
            credentialId={form.credentialId || null}
            credentialLabel={credentialLabel}
            projectHint={form.productId ? null : projectDisplayName(planToEdit?.project ?? null)}
            onProductSelect={(id, label) => {
              setForm((prev) => ({ ...prev, productId: id }));
              setProductLabel(label);
            }}
            onProductClear={() => {
              setForm((prev) => ({ ...prev, productId: '' }));
              setProductLabel(null);
            }}
            onCredentialSelect={(id, label) => {
              setForm((prev) => ({ ...prev, credentialId: id }));
              setCredentialLabel(label);
            }}
            onCredentialClear={() => {
              setForm((prev) => ({ ...prev, credentialId: '' }));
              setCredentialLabel(null);
            }}
          />
          <div className="flex items-center gap-2">
            <Checkbox
              id="auto-gen"
              checked={form.autoGenerate}
              onCheckedChange={(v) => setForm({ ...form, autoGenerate: v === true })}
            />
            <Label htmlFor="auto-gen" className="text-sm font-normal">
              {t('create.autoGenerate')}
            </Label>
          </div>
          <div className="space-y-2">
            <Label>{t('create.notes')}</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tCommon('cancel')}
            </Button>
            <Button type="submit" disabled={loading || !canSubmit}>
              {loading
                ? tCommon('saving')
                : planToEdit
                  ? tCommon('save')
                  : t('create.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
