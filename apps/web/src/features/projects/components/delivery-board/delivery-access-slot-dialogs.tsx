'use client';

import { CredentialFormSheet } from '@/features/credentials/components/credential-form-sheet';
import {
  productsApi,
  type ProductAccessSlotBindMeta,
  type ProductAccessSlotRow,
} from '@/lib/api/products';
import { resolveSlotCreateCategory, UNIVERSAL_ACCESS_SLOT_KEY } from '@nbos/shared';
import { toast } from 'sonner';
import { formatDeliveryAccessSlotLabel } from './delivery-access-slot-label';

function toastCreateAndBindSuccess(meta: ProductAccessSlotBindMeta | undefined) {
  if (
    meta &&
    meta.requestedSlotKey === UNIVERSAL_ACCESS_SLOT_KEY &&
    meta.effectiveSlotKey !== UNIVERSAL_ACCESS_SLOT_KEY
  ) {
    toast.success(
      `Saved to Credentials — filed under ${formatDeliveryAccessSlotLabel(meta.effectiveSlotLabel)}`,
    );
    return;
  }
  toast.success('Saved to Credentials and linked');
}

interface CreateAccessSlotCredentialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  productId: string;
  productName: string;
  slot: ProductAccessSlotRow;
  onBound: () => void;
}

export function CreateAccessSlotCredentialDialog({
  open,
  onOpenChange,
  projectId,
  productId,
  productName,
  slot,
  onBound,
}: CreateAccessSlotCredentialDialogProps) {
  const slotLabel = formatDeliveryAccessSlotLabel(slot.label);
  return (
    <CredentialFormSheet
      open={open}
      onOpenChange={onOpenChange}
      forceNestedBackdrop
      vaultScope="project"
      projectId={projectId}
      productId={productId}
      initialName={productName.trim() || slotLabel}
      allowedCategories={slot.allowedCategories}
      initialCategory={resolveSlotCreateCategory(slot)}
      initialCredentialType={slot.defaultCredentialType ?? 'LOGIN_PASSWORD'}
      submitLabel="Save & link"
      successToast={false}
      presetKey={slot.slotKey}
      onCreated={async (created) => {
        try {
          const res = await productsApi.bindAccessSlot(productId, {
            slotKey: slot.slotKey,
            credentialId: created.id,
          });
          toastCreateAndBindSuccess(res.bindMeta);
          onBound();
        } catch {
          toast.error('Credential was created but could not be linked to this slot.');
          onBound();
        }
      }}
    />
  );
}
