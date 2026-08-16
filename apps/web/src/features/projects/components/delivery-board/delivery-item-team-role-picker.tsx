'use client';

import { RelationPickerField } from '@/components/shared';
import { useRelationPickerActions } from '@/components/shared/relation-picker';
import type { ProductEmployee } from '@/lib/api/products';
import type { EmployeeSearchFn } from './delivery-item-detail-employee-search';

function personName(p: ProductEmployee | null | undefined): string {
  if (!p) return '';
  return `${p.firstName} ${p.lastName}`.trim();
}

export function SellerReadOnlyRow({ seller }: { seller: ProductEmployee | null | undefined }) {
  const employeePicker = useRelationPickerActions('employee');
  const name = personName(seller);

  return (
    <RelationPickerField
      label="Seller"
      entityKind="employee"
      value={seller?.id ?? null}
      selectionLabel={name || null}
      selectionAvatar={seller?.avatar}
      selectionSubtitle={seller?.email ?? null}
      placeholder="Not assigned"
      readOnly
      onSearch={async () => []}
      onSelect={() => {}}
      {...employeePicker}
    />
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
