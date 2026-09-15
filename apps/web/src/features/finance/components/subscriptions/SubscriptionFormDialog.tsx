'use client';

import { useEffect, useRef, useState } from 'react';
import { CreateFormDialog, InlineField } from '@/components/shared';
import {
  usePartnerRelationSearch,
  useProductRelationSearch,
  useRelationPickerActions,
} from '@/components/shared/relation-picker';
import {
  buildCreateSubscriptionFormDefaults,
  subscriptionToFormState,
  type SubscriptionFormState,
} from '@/features/finance/utils/subscription-form-state';
import { SubscriptionFormDialogProductField } from '@/features/finance/components/subscriptions/subscription-form-dialog-product-field';
import { buildBillingPeriodChangeConfirmDescription } from '@/features/finance/utils/subscription-billing-period-change';
import { getSubscriptionDisplayTitle } from '@/features/finance/utils/subscription-display';
import { SubscriptionBillingPeriodConfirmDialog } from '@/features/finance/components/subscriptions/SubscriptionBillingPeriodConfirmDialog';
import { SubscriptionFormDialogBillingFields } from '@/features/finance/components/subscriptions/SubscriptionFormDialogBillingFields';
import { SubscriptionFormDialogMetaFields } from '@/features/finance/components/subscriptions/SubscriptionFormDialogMetaFields';
import { useSubscriptionFormDialogActions } from '@/features/finance/components/subscriptions/use-subscription-form-dialog-actions';
import type { Subscription } from '@/lib/api/finance';
import { productsApi } from '@/lib/api/products';

interface SubscriptionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  subscription?: Subscription | null;
  onSaved: (subscription: Subscription) => void;
  /** Create from Product Finance: product is locked to this id. */
  defaultProductId?: string | null;
  defaultProjectId?: string | null;
  defaultProductLabel?: string | null;
}

export function SubscriptionFormDialog({
  open,
  onOpenChange,
  mode,
  subscription = null,
  onSaved,
  defaultProductId = null,
  defaultProjectId = null,
  defaultProductLabel = null,
}: SubscriptionFormDialogProps) {
  const [form, setForm] = useState<SubscriptionFormState>(() =>
    buildCreateSubscriptionFormDefaults(),
  );
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

  const productLocked = mode === 'create' && Boolean(defaultProductId?.trim());
  const wasOpenRef = useRef(false);

  useEffect(() => {
    const justOpened = open && !wasOpenRef.current;
    wasOpenRef.current = open;
    if (!open) {
      setProductResolving(false);
      return;
    }
    if (!justOpened) return;
    resetFormForOpen({
      mode,
      subscription,
      defaultProductId,
      defaultProjectId,
      defaultProductLabel,
      setForm,
      setEditSnap,
      setProductLabel,
      setPartnerLabel,
    });
  }, [open, mode, subscription, defaultProductId, defaultProjectId, defaultProductLabel]);

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

  const patchForm = (partial: Partial<SubscriptionFormState>) => {
    setForm((prev) => ({ ...prev, ...partial }));
  };

  return (
    <>
      <CreateFormDialog
        open={open}
        onOpenChange={onOpenChange}
        title={mode === 'edit' ? 'Edit subscription' : 'New subscription'}
        error={formError}
        submitting={loading}
        canSubmit={canSubmit && !productResolving}
        submitLabel={mode === 'edit' ? 'Save changes' : 'Create subscription'}
        submittingLabel="Saving…"
        cancelLabel="Cancel"
        onSubmit={(event) => void handleSubmit(event)}
      >
        <InlineField
          variant="controlled"
          label="Name"
          type="text"
          value={form.name}
          placeholder="Commercial subscription name"
          onValueChange={(name) => patchForm({ name })}
        />

        <SubscriptionFormDialogProductField
          mode={mode}
          productLocked={productLocked}
          productId={form.productId}
          productLabel={productLabel}
          productResolving={productResolving}
          subscription={subscription}
          searchProducts={searchProducts}
          productPicker={productPicker}
          onProductSelect={(id, label) => {
            void handleProductSelect(id, label);
          }}
        />

        <SubscriptionFormDialogBillingFields
          form={form}
          billingValidationError={billingValidationError}
          onAmountChange={(amount) => patchForm({ amount })}
          onBillingDayChange={(billingDay) => patchForm({ billingDay })}
          onTaxStatusChange={(taxStatus) => patchForm({ taxStatus })}
          onTypeChange={(type) => patchForm({ type })}
          onPeriodChange={applyPeriodChange}
        />

        <SubscriptionFormDialogMetaFields
          form={form}
          partnerLabel={partnerLabel}
          searchPartners={searchPartners}
          partnerPicker={partnerPicker}
          onFormChange={patchForm}
          onPartnerSelect={(id, label) => {
            patchForm({ partnerId: id });
            setPartnerLabel(label);
          }}
          onPartnerClear={() => {
            patchForm({ partnerId: '' });
            setPartnerLabel(null);
          }}
        />
      </CreateFormDialog>
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
          onOpenChange={(nextOpen) => {
            if (!nextOpen) closeSaveConfirm();
          }}
          onConfirm={() => void submitForm().finally(() => closeSaveConfirm())}
          forceNestedBackdrop
        />
      ) : null}
    </>
  );
}

function resetFormForOpen(options: {
  mode: 'create' | 'edit';
  subscription: Subscription | null;
  defaultProductId: string | null;
  defaultProjectId: string | null;
  defaultProductLabel: string | null;
  setForm: (state: SubscriptionFormState) => void;
  setEditSnap: (state: SubscriptionFormState | null) => void;
  setProductLabel: (label: string | null) => void;
  setPartnerLabel: (label: string | null) => void;
}): void {
  if (options.mode === 'edit' && options.subscription) {
    const state = subscriptionToFormState(options.subscription);
    options.setForm(state);
    options.setEditSnap(state);
    options.setProductLabel(options.subscription.product?.name ?? null);
    options.setPartnerLabel(options.subscription.partner?.name ?? null);
    return;
  }
  options.setForm(
    buildCreateSubscriptionFormDefaults({
      productId: options.defaultProductId,
      projectId: options.defaultProjectId,
    }),
  );
  options.setEditSnap(null);
  options.setProductLabel(options.defaultProductLabel?.trim() || null);
  options.setPartnerLabel(null);
}
