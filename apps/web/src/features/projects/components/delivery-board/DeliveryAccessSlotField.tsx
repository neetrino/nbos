'use client';

import { Asterisk, ChevronRight, Plus, X } from 'lucide-react';
import {
  DETAIL_SHEET_FIELD_CLEAR_BTN_CLASS,
  DETAIL_SHEET_OUTLINED_ADD_BTN_CLASS,
  DETAIL_SHEET_OUTLINED_ADD_PLUS_CLASS,
  DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS,
  DETAIL_SHEET_OUTLINED_LABEL_CLASS,
  RELATION_PICKER_CHIP_SHELL_CLASS,
  RELATION_PICKER_CHIP_STACK_CLASS,
  RELATION_PICKER_EMPTY_TRIGGER_CLASS,
  RELATION_PICKER_SHEET_TARGET_BUTTON_CLASS,
  RELATION_PICKER_SHEET_TARGET_LABEL_CLASS,
} from '@/components/shared/detail-sheet-classes';
import { usePermission } from '@/lib/permissions';
import type { ProductAccessSlotBindingItem, ProductAccessSlotRow } from '@/lib/api/products';
import { cn } from '@/lib/utils';
import { formatDeliveryAccessSlotLabel } from './delivery-access-slot-label';

export interface DeliveryAccessSlotFieldProps {
  slot: ProductAccessSlotRow;
  onOpenCredential: (credentialId: string) => void;
  onCreate: () => void;
  onUnbind: (bindingId: string) => void;
}

export function DeliveryAccessSlotField({
  slot,
  onOpenCredential,
  onCreate,
  onUnbind,
}: DeliveryAccessSlotFieldProps) {
  const label = formatDeliveryAccessSlotLabel(slot.label);

  return (
    <div className={DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS}>
      <AccessSlotNotchCaption label={label} required={slot.required} onCreate={onCreate} />

      {slot.bindings.length > 0 ? (
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
      ) : (
        <div
          className={cn(
            RELATION_PICKER_EMPTY_TRIGGER_CLASS,
            'pointer-events-none border-dashed italic',
          )}
        >
          Not linked
        </div>
      )}
    </div>
  );
}

function AccessSlotNotchCaption({
  label,
  required,
  onCreate,
}: {
  label: string;
  required: boolean;
  onCreate: () => void;
}) {
  const { can, isLoading } = usePermission();
  const caption = (
    <span className="inline-flex max-w-[12rem] items-center gap-0.5 truncate">
      {label}
      {required ? <RequiredAsterisk /> : null}
    </span>
  );

  if (isLoading || !can('ADD', 'CREDENTIALS')) {
    return <span className={DETAIL_SHEET_OUTLINED_LABEL_CLASS}>{caption}</span>;
  }

  return (
    <button
      type="button"
      onClick={onCreate}
      className={DETAIL_SHEET_OUTLINED_ADD_BTN_CLASS}
      title="New credential"
      aria-label={`New credential for ${label}`}
    >
      <Plus size={12} aria-hidden className={DETAIL_SHEET_OUTLINED_ADD_PLUS_CLASS} />
      {caption}
    </button>
  );
}

function RequiredAsterisk() {
  return (
    <span
      title="At least one credential required for this slot"
      className="shrink-0 text-amber-600"
    >
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
  if (!binding.boundCredential) {
    return (
      <li className={RELATION_PICKER_CHIP_SHELL_CLASS}>
        <span className="text-muted-foreground flex-1 truncate text-sm italic">
          Archived credential
        </span>
        <AccessSlotUnlinkButton onUnbind={onUnbind} />
      </li>
    );
  }

  const name = binding.boundCredential.name;
  return (
    <li className={RELATION_PICKER_CHIP_SHELL_CLASS}>
      <button
        type="button"
        onClick={() => onOpenCredential(binding.boundCredential!.id)}
        className={cn(
          RELATION_PICKER_SHEET_TARGET_BUTTON_CLASS,
          'flex min-w-0 flex-1 items-center gap-1.5 text-left',
        )}
        aria-label={`Open ${name}`}
      >
        <span className={cn(RELATION_PICKER_SHEET_TARGET_LABEL_CLASS, 'text-sm font-medium')}>
          {name}
        </span>
        <ChevronRight
          size={14}
          className="text-muted-foreground/70 ml-auto shrink-0 opacity-60"
          aria-hidden
        />
      </button>
      <AccessSlotUnlinkButton onUnbind={onUnbind} />
    </li>
  );
}

function AccessSlotUnlinkButton({ onUnbind }: { onUnbind: () => void }) {
  return (
    <button
      type="button"
      onClick={onUnbind}
      className={cn(DETAIL_SHEET_FIELD_CLEAR_BTN_CLASS, 'shrink-0')}
      title="Unlink"
      aria-label="Unlink"
    >
      <X size={14} />
    </button>
  );
}
