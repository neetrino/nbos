'use client';

import { useEffect, useState } from 'react';
import { Receipt } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DetailSheetFieldSegmented } from '@/components/shared';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SUBSCRIPTION_TYPES } from '@/features/finance/constants/finance';
import { TAX_STATUSES } from '@/features/finance/components/expenses/edit-expense-dialog-constants';
import { PROJECTS_PAGE_SIZE } from '@/features/finance/components/expenses/edit-expense-dialog-constants';
import {
  EMPTY_SUBSCRIPTION_FORM,
  subscriptionToFormState,
  type SubscriptionFormState,
} from '@/features/finance/utils/subscription-form-state';
import { buildBillingPeriodChangeConfirmDescription } from '@/features/finance/utils/subscription-billing-period-change';
import { SubscriptionBillingPeriodConfirmDialog } from '@/features/finance/components/subscriptions/SubscriptionBillingPeriodConfirmDialog';
import { SubscriptionFormDialogBillingFields } from '@/features/finance/components/subscriptions/SubscriptionFormDialogBillingFields';
import { SubscriptionFormDialogMetaFields } from '@/features/finance/components/subscriptions/SubscriptionFormDialogMetaFields';
import { useSubscriptionFormDialogActions } from '@/features/finance/components/subscriptions/use-subscription-form-dialog-actions';
import type { Subscription } from '@/lib/api/finance';
import { projectsApi, type Project } from '@/lib/api/projects';
import { productsApi, type Product } from '@/lib/api/products';
import { partnersApi, type Partner } from '@/lib/api/partners';

const PARTNERS_PAGE_SIZE = 100;
const PRODUCTS_PAGE_SIZE = 100;

function normalizeSelectValue(value: string | null): string {
  return value ?? '';
}

interface SubscriptionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  subscription?: Subscription | null;
  onSaved: (subscription: Subscription) => void;
}

export function SubscriptionFormDialog({
  open,
  onOpenChange,
  mode,
  subscription = null,
  onSaved,
}: SubscriptionFormDialogProps) {
  const [form, setForm] = useState<SubscriptionFormState>({ ...EMPTY_SUBSCRIPTION_FORM });
  const [editSnap, setEditSnap] = useState<SubscriptionFormState | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);

  const {
    loading,
    formError,
    canSubmit,
    billingValidationError,
    periodConfirmOpen,
    setPeriodConfirmOpen,
    handleSubmit,
    submitForm,
    applyPeriodChange,
  } = useSubscriptionFormDialogActions({
    mode,
    form,
    setForm,
    editSnap,
    subscription,
    onSaved,
    onOpenChange,
  });

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void (async () => {
      setOptionsLoading(true);
      try {
        const [projectRes, productRes, partnerRes] = await Promise.all([
          projectsApi.getAll({ page: 1, pageSize: PROJECTS_PAGE_SIZE }),
          productsApi.getAll({ page: 1, pageSize: PRODUCTS_PAGE_SIZE }),
          partnersApi.getAll({ page: 1, pageSize: PARTNERS_PAGE_SIZE, scope: 'active' }),
        ]);
        if (!cancelled) {
          setProjects(projectRes.items);
          setProducts(productRes.items);
          setPartners(partnerRes.items);
        }
      } catch {
        if (!cancelled) {
          setProjects([]);
          setProducts([]);
          setPartners([]);
        }
      } finally {
        if (!cancelled) setOptionsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const handleOpenChange = (next: boolean) => {
    if (next) {
      if (mode === 'edit' && subscription) {
        const state = subscriptionToFormState(subscription);
        setForm(state);
        setEditSnap(state);
      } else {
        setForm({ ...EMPTY_SUBSCRIPTION_FORM });
        setEditSnap(null);
      }
    }
    onOpenChange(next);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{mode === 'edit' ? 'Edit subscription' : 'New subscription'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
            {formError ? <p className="text-destructive text-sm">{formError}</p> : null}

            {mode === 'create' ? (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sub-product">Product</Label>
                <Select
                  value={form.productId || undefined}
                  onValueChange={(v) => {
                    const product = products.find((p) => p.id === v);
                    setForm({
                      ...form,
                      productId: normalizeSelectValue(v),
                      projectId: product?.projectId ?? form.projectId,
                    });
                  }}
                  disabled={optionsLoading}
                >
                  <SelectTrigger id="sub-product">
                    <SelectValue placeholder={optionsLoading ? 'Loading…' : 'Select product'} />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => {
                      const project = projects.find((proj) => proj.id === p.projectId);
                      const projectLabel = project
                        ? `${project.code} — ${project.name}`
                        : p.projectId;
                      return (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} ({projectLabel})
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">
                Product:{' '}
                {subscription?.product?.name ??
                  products.find((p) => p.id === form.productId)?.name ??
                  form.productId}
                {subscription?.project
                  ? ` · Project ${subscription.project.code} — ${subscription.project.name}`
                  : null}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sub-type">Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: normalizeSelectValue(v) })}
              >
                <SelectTrigger id="sub-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUBSCRIPTION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <SubscriptionFormDialogBillingFields
              form={form}
              billingValidationError={billingValidationError}
              onAmountChange={(amount) => setForm({ ...form, amount })}
              onBillingDayChange={(billingDay) => setForm({ ...form, billingDay })}
              onPeriodChange={applyPeriodChange}
            />

            <DetailSheetFieldSegmented
              label="Tax status"
              icon={<Receipt size={12} />}
              value={form.taxStatus}
              options={TAX_STATUSES}
              onValueChange={(taxStatus) => setForm({ ...form, taxStatus })}
            />

            <SubscriptionFormDialogMetaFields
              form={form}
              partners={partners}
              optionsLoading={optionsLoading}
              onFormChange={(partial) => setForm({ ...form, ...partial })}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !canSubmit}>
                {loading ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Create subscription'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {mode === 'edit' && editSnap && subscription ? (
        <SubscriptionBillingPeriodConfirmDialog
          open={periodConfirmOpen}
          subscriptionCode={subscription.code}
          description={buildBillingPeriodChangeConfirmDescription(
            editSnap,
            form,
            subscription.monthlyEquivalentAmount,
          )}
          isSubmitting={loading}
          onOpenChange={setPeriodConfirmOpen}
          onConfirm={() => void submitForm().finally(() => setPeriodConfirmOpen(false))}
          forceNestedBackdrop
        />
      ) : null}
    </>
  );
}
