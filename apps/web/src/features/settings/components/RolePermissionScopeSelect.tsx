'use client';

import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { rolePermissionScopeTone } from '@/features/settings/components/role-permission-scope-tone';
import {
  ROLE_PERMISSION_SCOPE_OPTIONS,
  type RolePermissionScope,
} from '@/features/settings/components/role-permissions-types';

/** Matches the scope control so column titles sit on the button, not the gap. */
export const ROLE_PERMISSION_SCOPE_CONTROL_CLASS = 'w-[8.75rem]';

export function RolePermissionScopeSelect(props: {
  value: RolePermissionScope;
  onValueChange: (scope: RolePermissionScope) => void;
}) {
  return (
    <Select
      value={props.value}
      onValueChange={(value) => props.onValueChange(value as RolePermissionScope)}
    >
      <SelectTrigger
        size="sm"
        className={cn(ROLE_PERMISSION_SCOPE_CONTROL_CLASS, rolePermissionScopeTone(props.value))}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ROLE_PERMISSION_SCOPE_OPTIONS.map((option) => (
          <SelectItem key={option} value={option} tone="highlight">
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
