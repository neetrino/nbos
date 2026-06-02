'use client';

import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    <div className="border-border grid gap-2 rounded-lg border px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-sm">
          {grant.employee.firstName} {grant.employee.lastName}
        </span>
        <div className="flex shrink-0 items-center gap-1">
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
      </div>
      <div className="grid gap-1">
        <label className="text-muted-foreground text-[11px]" htmlFor={`exp-${grant.employeeId}`}>
          Expires (optional)
        </label>
        <Input
          id={`exp-${grant.employeeId}`}
          type="date"
          value={dateValue}
          className="h-8 text-xs"
          onChange={(e) => {
            const next = e.target.value.trim();
            onExpiresAtChange(grant.employeeId, next ? `${next}T23:59:59.999Z` : null);
          }}
        />
      </div>
    </div>
  );
}
