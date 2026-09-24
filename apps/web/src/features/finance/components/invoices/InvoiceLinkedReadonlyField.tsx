'use client';

import type { ReactNode } from 'react';
import { RelationPickerField } from '@/components/shared';
import type { RelationEntityKind } from '@/components/shared/relation-picker/relation-picker.types';

const emptyRelationSearch = async () => [];

/** Linked row with the company-field look. Opens a sheet and cannot be replaced. */
export function InvoiceLinkedReadonlyField({
  label,
  entityKind,
  value,
  selectionLabel,
  icon,
  onOpen,
}: {
  label: string;
  entityKind: RelationEntityKind;
  value: string;
  selectionLabel: string;
  icon: ReactNode;
  onOpen: () => void;
}) {
  return (
    <RelationPickerField
      label={label}
      entityKind={entityKind}
      value={value}
      selectionLabel={selectionLabel}
      icon={icon}
      readOnly
      placeholder={label}
      onSearch={emptyRelationSearch}
      onSelect={() => undefined}
      onOpenSelected={onOpen}
    />
  );
}
