'use client';

import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NbosDatePicker } from '@/components/shared/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  const dateValue = grant.expiresAt ? grant.expiresAt.slice(0, 10) : '';

  return (
    <div className="border-border flex flex-wrap items-end gap-2 rounded-lg border px-3 py-2">
      <span className="min-w-[8rem] flex-1 truncate text-sm">
        {grant.employee.firstName} {grant.employee.lastName}
      </span>
      <div className="grid gap-0.5">
        <span className="text-muted-foreground text-[11px]">Expires</span>
        <NbosDatePicker
          variant="compact"
          mode="date"
          value={dateValue}
          clearable
          placeholder="—"
          aria-label={`Expires for ${grant.employee.firstName} ${grant.employee.lastName}`}
          className="w-[10.5rem]"
          onChange={(next) => {
            const trimmed = next.trim();
            onExpiresAtChange(grant.employeeId, trimmed ? `${trimmed}T23:59:59.999Z` : null);
          }}
        />
      </div>
      <Select
        value={grant.level}
        onValueChange={(v) => {
          if (v === 'VIEW' || v === 'EDIT') onLevelChange(grant.employeeId, v);
        }}
      >
        <SelectTrigger className="h-8 w-[5.5rem] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="VIEW">View</SelectItem>
          <SelectItem value="EDIT">Edit</SelectItem>
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        title="Remove manual access"
        onClick={() => onRemove(grant.employeeId)}
      >
        <Trash2 size={14} className="text-destructive" />
      </Button>
    </div>
  );
}
