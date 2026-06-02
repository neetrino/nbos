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
import { TEAM_OPEN_EMPLOYEE_QUERY } from '@/features/hr/constants/team-open-query';
import type { CredentialManualGrant } from '@/lib/api/credentials';

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
        <>
          <NbosDatePicker
            variant="compact"
            mode="date"
            embedded
            iconLeading
            value={dateValue}
            clearable
            placeholder="—"
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
              className="border-border/50 h-8 min-h-8 w-auto min-w-[3.5rem] shrink-0 justify-center gap-0 border px-2.5 text-xs font-normal normal-case shadow-none [&_svg]:hidden"
              aria-label={`Access for ${label}`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="VIEW">View</SelectItem>
              <SelectItem value="EDIT">Edit</SelectItem>
            </SelectContent>
          </Select>
        </>
      }
    />
  );
}
