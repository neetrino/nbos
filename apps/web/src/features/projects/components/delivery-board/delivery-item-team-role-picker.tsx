'use client';

import { RelationPickerField } from '@/components/shared';
import { RelationPickerChip } from '@/components/shared/relation-picker/RelationPickerChip';
import { useEntityRelations } from '@/components/shared/relation-picker/entity-relations-context';
import { useRelationPickerActions } from '@/components/shared/relation-picker';
import {
  DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS,
  DETAIL_SHEET_OUTLINED_LABEL_CLASS,
  RELATION_PICKER_EMPTY_TRIGGER_CLASS,
} from '@/components/shared/detail-sheet-classes';
import type { ProductEmployee } from '@/lib/api/products';
import { cn } from '@/lib/utils';
import type { EmployeeSearchFn } from './delivery-item-detail-employee-search';

function personName(p: ProductEmployee | null | undefined): string {
  if (!p) return '';
  return `${p.firstName} ${p.lastName}`.trim();
}

export function SellerReadOnlyRow({ seller }: { seller: ProductEmployee | null | undefined }) {
  const relations = useEntityRelations();
  const name = personName(seller);

  return (
    <div className={DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS}>
      <span className={DETAIL_SHEET_OUTLINED_LABEL_CLASS}>Seller</span>
      {name && seller ? (
        <RelationPickerChip
          label={name}
          subtitle={seller.email ?? null}
          entityKind="employee"
          imageUrl={seller.avatar}
          onOpen={() => void relations.openEntity('employee', seller.id)}
        />
      ) : (
        <div
          className={cn(
            RELATION_PICKER_EMPTY_TRIGGER_CLASS,
            'pointer-events-none border-dashed italic',
          )}
        >
          Not assigned
        </div>
      )}
    </div>
  );
}

export function ProductRolePicker({
  label,
  employeeId,
  employeeLabel,
  employeeAvatar,
  onSelect,
  onClear,
  onSearchEmployees,
  disabled,
  className,
}: {
  label: string;
  employeeId: string | null;
  employeeLabel: string;
  employeeAvatar?: string | null;
  onSelect: (id: string, name: string, avatar?: string) => void;
  onClear?: () => void;
  onSearchEmployees: EmployeeSearchFn;
  disabled?: boolean;
  className?: string;
}) {
  const employeePicker = useRelationPickerActions('employee');

  return (
    <div className={className}>
      <RelationPickerField
        label={label}
        entityKind="employee"
        value={employeeId}
        selectionLabel={employeeLabel || null}
        selectionAvatar={employeeAvatar}
        placeholder="Choose…"
        onSearch={onSearchEmployees}
        onSelect={onSelect}
        onClear={onClear}
        disabled={disabled}
        {...employeePicker}
      />
    </div>
  );
}
