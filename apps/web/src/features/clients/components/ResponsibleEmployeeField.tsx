'use client';

import { User } from 'lucide-react';
import { RelationPickerField } from '@/components/shared';
import {
  useEmployeeRelationSearch,
  useRelationPickerActions,
} from '@/components/shared/relation-picker';

interface ResponsibleEmployeeFieldProps {
  value: string;
  selectionLabel: string;
  selectionAvatar: string | null;
  disabled?: boolean;
  onSelect: (id: string, label: string, avatar: string | null) => void;
  onClear: () => void;
}

export function ResponsibleEmployeeField({
  value,
  selectionLabel,
  selectionAvatar,
  disabled = false,
  onSelect,
  onClear,
}: ResponsibleEmployeeFieldProps) {
  const employeePicker = useRelationPickerActions('employee');
  const searchEmployees = useEmployeeRelationSearch();

  return (
    <RelationPickerField
      label="Responsible"
      entityKind="employee"
      value={value || null}
      selectionLabel={selectionLabel || null}
      selectionAvatar={selectionAvatar}
      placeholder="Optional — assign an employee"
      icon={<User size={12} />}
      disabled={disabled}
      onSearch={searchEmployees}
      onSelect={(id, label, avatar) => onSelect(id, label, avatar?.trim() || null)}
      onClear={disabled ? undefined : onClear}
      {...employeePicker}
    />
  );
}
