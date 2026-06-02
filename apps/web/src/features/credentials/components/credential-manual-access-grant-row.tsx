'use client';

import { useRouter } from 'next/navigation';
import { RelationPickerChip } from '@/components/shared/relation-picker/RelationPickerChip';
import { NbosDatePicker } from '@/components/shared/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CREDENTIAL_MANUAL_ACCESS_ACCESS_SELECT_CLASS } from '@/features/credentials/constants/credential-manual-access-inline-controls';
import { TEAM_OPEN_EMPLOYEE_QUERY } from '@/features/hr/constants/team-open-query';
import type { CredentialManualGrant } from '@/lib/api/credentials';

const MANUAL_ACCESS_TRAILING_GAP_CLASS = 'flex items-center gap-2';

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
  const router = useRouter();
  const dateValue = grant.expiresAt ? grant.expiresAt.slice(0, 10) : '';
  const label = `${grant.employee.firstName} ${grant.employee.lastName}`.trim();

  return (
    <RelationPickerChip
      label={label}
      subtitle={grant.employee.email || null}
      entityKind="employee"
      onOpen={() =>
        router.push(`/team?${TEAM_OPEN_EMPLOYEE_QUERY}=${encodeURIComponent(grant.employeeId)}`)
      }
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
              className={CREDENTIAL_MANUAL_ACCESS_ACCESS_SELECT_CLASS}
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
