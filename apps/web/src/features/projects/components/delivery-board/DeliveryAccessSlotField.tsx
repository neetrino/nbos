'use client';

import { useState } from 'react';
import { Asterisk, ChevronRight, Plus, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  DETAIL_SHEET_FIELD_CLEAR_BTN_CLASS,
  DETAIL_SHEET_OUTLINED_ADD_BTN_CLASS,
  DETAIL_SHEET_OUTLINED_ADD_PLUS_CLASS,
  DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS,
  RELATION_PICKER_CHIP_SHELL_CLASS,
  RELATION_PICKER_CHIP_STACK_CLASS,
  RELATION_PICKER_SHEET_TARGET_BUTTON_CLASS,
  RELATION_PICKER_SHEET_TARGET_LABEL_CLASS,
} from '@/components/shared/detail-sheet-classes';
import { RelationPickerField, useAccessSlotCredentialSearch } from '@/components/shared';
import { CredentialVaultMetaBadge } from '@/features/credentials/components/credential-vault-card-meta-row';
import { getCredentialCategoryMeta } from '@/features/credentials/constants/credential-category-meta';
import { credentialCategoryIcon } from '@/features/credentials/utils/credential-vault-card-meta';
import { usePermission } from '@/lib/permissions';
import type { ProductAccessSlotBindingItem, ProductAccessSlotRow } from '@/lib/api/products';
import { cn } from '@/lib/utils';
import { formatDeliveryAccessSlotLabel } from './delivery-access-slot-label';

export interface DeliveryAccessSlotFieldProps {
  productId: string;
  slot: ProductAccessSlotRow;
  onOpenCredential: (credentialId: string) => void;
  onCreate: () => void;
  onBind: (credentialId: string) => void;
  onUnbind: (bindingId: string) => void;
}

export function DeliveryAccessSlotField({
  productId,
  slot,
  onOpenCredential,
  onCreate,
  onBind,
  onUnbind,
}: DeliveryAccessSlotFieldProps) {
  const t = useTranslations('deliveryBoard');
  const { can } = usePermission();
  const [pickerOpen, setPickerOpen] = useState(false);
  const label = formatDeliveryAccessSlotLabel(slot.label);
  const boundIds = slot.bindings
    .map((binding) => binding.boundCredential?.id)
    .filter((id): id is string => Boolean(id));
  const search = useAccessSlotCredentialSearch(productId, slot.slotKey);
  const hasBindings = slot.bindings.length > 0;

  return (
    <div className={DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS}>
      <AccessSlotNotchCaption
        label={label}
        required={slot.required}
        onOpenPicker={() => setPickerOpen(true)}
      />

      {hasBindings ? (
        <ul className={RELATION_PICKER_CHIP_STACK_CLASS}>
          {slot.bindings.map((binding) => (
            <AccessSlotBindingRow
              key={binding.bindingId}
              binding={binding}
              onOpenCredential={onOpenCredential}
              onUnbind={() => onUnbind(binding.bindingId)}
            />
          ))}
        </ul>
      ) : null}

      {!hasBindings || pickerOpen ? (
        <RelationPickerField
          label=""
          entityKind="credential"
          multiple
          value={boundIds}
          selectionLabels={{}}
          selectionDisplay="none"
          placeholder={t('access.notLinked')}
          createLabel={t('access.create')}
          createPlacement="top"
          className="pt-0"
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          onSearch={search}
          onCreate={
            can('ADD', 'CREDENTIALS')
              ? () => {
                  setPickerOpen(false);
                  onCreate();
                }
              : undefined
          }
          onChange={(ids) => {
            const nextId = ids.find((id) => !boundIds.includes(id));
            if (!nextId) return;
            onBind(nextId);
            setPickerOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

function AccessSlotNotchCaption({
  label,
  required,
  onOpenPicker,
}: {
  label: string;
  required: boolean;
  onOpenPicker: () => void;
}) {
  const t = useTranslations('deliveryBoard');
  const caption = (
    <span className="inline-flex max-w-[12rem] items-center gap-0.5 truncate">
      {label}
      {required ? <RequiredAsterisk /> : null}
    </span>
  );

  return (
    <button
      type="button"
      onClick={onOpenPicker}
      className={DETAIL_SHEET_OUTLINED_ADD_BTN_CLASS}
      title={t('access.linkExisting')}
      aria-label={t('access.openPicker', { label })}
    >
      <Plus size={12} aria-hidden className={DETAIL_SHEET_OUTLINED_ADD_PLUS_CLASS} />
      {caption}
    </button>
  );
}

function RequiredAsterisk() {
  const t = useTranslations('deliveryBoard');
  return (
    <span title={t('access.requiredHint')} className="shrink-0 text-amber-600">
      <Asterisk size={10} strokeWidth={2.5} aria-hidden />
    </span>
  );
}

function AccessSlotBindingRow({
  binding,
  onOpenCredential,
  onUnbind,
}: {
  binding: ProductAccessSlotBindingItem;
  onOpenCredential: (credentialId: string) => void;
  onUnbind: () => void;
}) {
  const t = useTranslations('deliveryBoard');
  if (!binding.boundCredential) {
    return (
      <li className={RELATION_PICKER_CHIP_SHELL_CLASS}>
        <span className="text-muted-foreground flex-1 truncate text-sm italic">
          {t('access.archived')}
        </span>
        <AccessSlotUnlinkButton onUnbind={onUnbind} />
      </li>
    );
  }

  const name = binding.boundCredential.name;
  const canReveal = binding.boundCredential.canReveal !== false;
  return (
    <li className={RELATION_PICKER_CHIP_SHELL_CLASS}>
      <button
        type="button"
        onClick={() => onOpenCredential(binding.boundCredential!.id)}
        className={cn(
          RELATION_PICKER_SHEET_TARGET_BUTTON_CLASS,
          'flex min-w-0 flex-1 items-center gap-1.5 text-left',
        )}
        aria-label={canReveal ? t('access.open', { name }) : t('access.requestAccess', { name })}
      >
        <span
          className={cn(
            RELATION_PICKER_SHEET_TARGET_LABEL_CLASS,
            'min-w-0 flex-1 truncate text-sm font-medium',
          )}
        >
          {name}
        </span>
        <AccessSlotCategoryBadge category={binding.boundCredential.category} />
        <ChevronRight
          size={14}
          className="text-muted-foreground/70 shrink-0 opacity-60"
          aria-hidden
        />
      </button>
      <AccessSlotUnlinkButton onUnbind={onUnbind} />
    </li>
  );
}

function AccessSlotCategoryBadge({ category }: { category: string }) {
  const meta = getCredentialCategoryMeta(category);
  return (
    <CredentialVaultMetaBadge
      item={{
        key: 'category',
        label: meta.label,
        variant: meta.badgeVariant,
        icon: credentialCategoryIcon(category),
      }}
    />
  );
}

function AccessSlotUnlinkButton({ onUnbind }: { onUnbind: () => void }) {
  const t = useTranslations('deliveryBoard');
  return (
    <button
      type="button"
      onClick={onUnbind}
      className={cn(DETAIL_SHEET_FIELD_CLEAR_BTN_CLASS, 'shrink-0')}
      title={t('access.unlink')}
      aria-label={t('access.unlink')}
    >
      <X size={14} />
    </button>
  );
}
