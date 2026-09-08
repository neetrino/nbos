'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ROLE_PERMISSION_SCOPE_OPTIONS,
  type RolePermissionScope,
} from '@/features/settings/components/role-permissions-types';

export function RolePermissionScopeSelect(props: {
  value: RolePermissionScope;
  onValueChange: (scope: RolePermissionScope) => void;
}) {
  return (
    <Select
      value={props.value}
      onValueChange={(value) => props.onValueChange(value as RolePermissionScope)}
    >
      <SelectTrigger className="h-8 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ROLE_PERMISSION_SCOPE_OPTIONS.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
