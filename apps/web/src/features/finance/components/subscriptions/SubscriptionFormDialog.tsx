'use client';

import { useEffect, useState } from 'react';
import { Handshake, Layers, Receipt } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DetailSheetFieldSegmented, RelationPickerField } from '@/components/shared';
import {
  usePartnerRelationSearch,
  useProductRelationSearch,
  useRelationPickerActions,
} from '@/components/shared/relation-picker';
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
import {
  EMPTY_SUBSCRIPTION_FORM,
  subscriptionToFormState,
  type SubscriptionFormState,
} from '@/features/finance/utils/subscription-form-state';
import { buildBillingPeriodChangeConfirmDescription } from '@/features/finance/utils/subscription-billing-period-change';
import { getSubscriptionDisplayTitle } from '@/features/finance/utils/subscription-display';
import { SubscriptionBillingPeriodConfirmDialog } from '@/features/finance/components/subscriptions/SubscriptionBillingPeriodConfirmDialog';
import { SubscriptionFormDialogBillingFields } from '@/features/finance/components/subscriptions/SubscriptionFormDialogBillingFields';
import { SubscriptionFormDialogMetaFields } from '@/features/finance/components/subscriptions/SubscriptionFormDialogMetaFields';
import { useSubscriptionFormDialogActions } from '@/features/finance/components/subscriptions/use-subscription-form-dialog-actions';
import type { Subscription } from '@/lib/api/finance';
import { productsApi } from '@/lib/api/products';

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
  const [productLabel, setProductLabel] = useState<string | null>(null);
  const [partnerLabel, setPartnerLabel] = useState<string | null>(null);
  const [productResolving, setProductResolving] = useState(false);

  const searchProducts = useProductRelationSearch(null);
  const searchPartners = usePartnerRelationSearch();
  const productPicker = useRelationPickerActions('product');
  const partnerPicker = useRelationPickerActions('partner');

  const {
    loading,
    formError,
    canSubmit,
    billingValidationError,
    saveConfirmOpen,
    saveConfirmTitle,
    saveConfirmDescription,
    closeSaveConfirm,
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

  const handleOpenChange = (next: boolean) => {
    if (next) {
      if (mode === 'edit' && subscription) {
        const state = subscriptionToFormState(subscription);
        setForm(state);
        setEditSnap(state);
        setProductLabel(subscription.product?.name ?? null);
        setPartnerLabel(subscription.partner?.name ?? null);
      } else {
        setForm({ ...EMPTY_SUBSCRIPTION_FORM });
        setEditSnap(null);
        setProductLabel(null);
        setPartnerLabel(null);
      }
    }
    onOpenChange(next);
  };

  useEffect(() => {
    if (!open) setProductResolving(false);
  }, [open]);

  const handleProductSelect = async (productId: string, label: string) => {
    setProductLabel(label);
    setProductResolving(true);
    try {
      const product = await productsApi.getById(productId);
      setForm((prev) => ({
        ...prev,
        productId,
        projectId: product.projectId,
      }));
    } catch {
      setForm((prev) => ({ ...prev, productId, projectId: prev.projectId }));
    } finally {
      setProductResolving(false);
    }
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

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sub-name">Name</Label>
              <Input
                id="sub-name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Commercial subscription name"
                autoComplete="off"
                required
              />
            </div>

            {mode === 'create' ? (
              <RelationPickerField
                label="Product"
                entityKind="product"
                value={form.productId || null}
                selectionLabel={productLabel}
                placeholder={productResolving ? 'Resolving product…' : 'Search products…'}
                icon={<Layers size={12} />}
                disabled={productResolving}
                onSearch={searchProducts}
                onSelect={(id, label) => {
                  void handleProductSelect(id, label);
                }}
                {...productPicker}
              />
            ) : (
              <div className="text-muted-foreground text-sm">
                Product: {subscription?.product?.name ?? productLabel ?? form.productId}
                {subscription?.project ? ` · Project ${subscription.project.name}` : null}
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

            <RelationPickerField
              label="Partner (optional)"
              entityKind="partner"
              value={form.partnerId || null}
              selectionLabel={partnerLabel}
              placeholder="Search partners…"
              icon={<Handshake size={12} />}
              onSearch={searchPartners}
              onSelect={(id, label) => {
                setForm((prev) => ({ ...prev, partnerId: id }));
                setPartnerLabel(label);
              }}
              onClear={() => {
                setForm((prev) => ({ ...prev, partnerId: '' }));
                setPartnerLabel(null);
              }}
              {...partnerPicker}
            />

            <SubscriptionFormDialogMetaFields
              form={form}
              onFormChange={(partial) => setForm({ ...form, ...partial })}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !canSubmit || productResolving}>
                {loading ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Create subscription'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {mode === 'edit' && editSnap && subscription ? (
        <SubscriptionBillingPeriodConfirmDialog
          open={saveConfirmOpen}
          title={saveConfirmTitle}
          subscriptionTitle={getSubscriptionDisplayTitle(subscription)}
          description={
            saveConfirmDescription ??
            buildBillingPeriodChangeConfirmDescription(
              editSnap,
              form,
              subscription.monthlyEquivalentAmount,
            )
          }
          isSubmitting={loading}
          onOpenChange={(open) => {
            if (!open) closeSaveConfirm();
          }}
          onConfirm={() => void submitForm().finally(() => closeSaveConfirm())}
          forceNestedBackdrop
        />
      ) : null}
    </>
  );
}
