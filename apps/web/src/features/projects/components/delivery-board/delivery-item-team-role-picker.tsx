'use client';

import { User } from 'lucide-react';
import { RelationPickerField } from '@/components/shared';
import { RelationPickerChip } from '@/components/shared/relation-picker/RelationPickerChip';
import { useEntityRelations } from '@/components/shared/relation-picker/entity-relations-context';
import { useRelationPickerActions } from '@/components/shared/relation-picker';
import { RELATION_PICKER_EMPTY_TRIGGER_CLASS } from '@/components/shared/detail-sheet-classes';
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
    <div className="relative w-full min-w-0">
      <div className="text-foreground/85 mb-1.5 flex h-5 items-center gap-2 text-sm font-medium">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="text-muted-foreground/70 shrink-0">
            <User size={12} aria-hidden />
          </span>
          <span className="truncate">Seller</span>
        </div>
      </div>
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
        icon={<User size={12} />}
        onSearch={onSearchEmployees}
        onSelect={onSelect}
        onClear={onClear}
        disabled={disabled}
        {...employeePicker}
      />
    </div>
  );
}
