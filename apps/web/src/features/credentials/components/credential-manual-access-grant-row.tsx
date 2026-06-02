'use client';

import { EmployeePersonAvatar } from '@/components/shared/EmployeePersonAvatar';
import { RelationPickerChip } from '@/components/shared/relation-picker/RelationPickerChip';
import { useEntityRelations } from '@/components/shared/relation-picker/entity-relations-context';
import { NbosDatePicker } from '@/components/shared/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CredentialManualGrant } from '@/lib/api/credentials';

const MANUAL_ACCESS_TRAILING_GAP_CLASS = 'flex items-center gap-2';

const MANUAL_ACCESS_LEVEL_SELECT_CLASS =
  'w-auto min-w-[3.75rem] shrink-0 uppercase tracking-wide [&_svg]:hidden';

export interface CredentialManualAccessGrantRowProps {
  grant: CredentialManualGrant;
  onLevelChange: (employeeId: string, level: 'VIEW' | 'EDIT') => void;
  onExpiresAtChange: (employeeId: string, expiresAt: string | null) => void;
  onRemove: (employeeId: string) => void;
}

export function CredentialManualAccessGrantRow({
  grant,
  onLevelChange,
  onExpiresAtChange,
  onRemove,
}: CredentialManualAccessGrantRowProps) {
  const relations = useEntityRelations();
  const dateValue = grant.expiresAt ? grant.expiresAt.slice(0, 10) : '';
  const label = `${grant.employee.firstName} ${grant.employee.lastName}`.trim();

  return (
    <RelationPickerChip
      label={label}
      subtitle={grant.employee.email || null}
      icon={<EmployeePersonAvatar label={label} />}
      entityKind="employee"
      onOpen={() => void relations.openEntity('employee', grant.employeeId)}
      onClear={() => onRemove(grant.employeeId)}
      trailing={
        <span className={MANUAL_ACCESS_TRAILING_GAP_CLASS}>
          <NbosDatePicker
            variant="compact"
            mode="date"
            embedded
            iconButtonShell
            value={dateValue}
            clearable
            aria-label={`Expires for ${label}`}
            className="w-auto shrink-0"
            onChange={(next) => {
              const trimmed = next.trim();
              onExpiresAtChange(grant.employeeId, trimmed ? `${trimmed}T23:59:59.999Z` : null);
            }}
          />
          <Select
            value={grant.level}
            onValueChange={(v) => {
              if (v === 'VIEW' || v === 'EDIT') onLevelChange(grant.employeeId, v);
            }}
          >
            <SelectTrigger
              size="sm"
              className={MANUAL_ACCESS_LEVEL_SELECT_CLASS}
              aria-label={`Access for ${label}`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="VIEW">View</SelectItem>
              <SelectItem value="EDIT">Edit</SelectItem>
            </SelectContent>
          </Select>
        </span>
      }
    />
  );
}
