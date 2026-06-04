'use client';

import { useCallback, useMemo } from 'react';
import { User } from 'lucide-react';
import { RelationPickerField } from '@/components/shared';
import {
  RELATION_PICKER_CHIP_STACK_CLASS,
  RELATION_PICKER_DROPDOWN_LIST_SIX_ROWS_CLASS,
} from '@/components/shared/detail-sheet-classes';
import { useRelationPickerActions } from '@/components/shared/relation-picker';
import { useEmployeeRelationSearch } from '@/components/shared/relation-picker/relation-search-loaders';
import { CredentialManualAccessGrantRow } from './credential-manual-access-grant-row';
import type { CredentialManualGrant } from '@/lib/api/credentials';

export interface CredentialManualAccessPanelProps {
  grants: CredentialManualGrant[];
  inheritedSummary: string;
  onGrantsChange: (grants: CredentialManualGrant[]) => void;
}

export function CredentialManualAccessPanel({
  grants,
  inheritedSummary,
  onGrantsChange,
}: CredentialManualAccessPanelProps) {
  const grantIds = useMemo(() => new Set(grants.map((g) => g.employeeId)), [grants]);
  const searchEmployees = useEmployeeRelationSearch(grantIds);
  const employeePicker = useRelationPickerActions('employee', 'credential-manual-access');

  const addEmployee = useCallback(
    (employeeId: string, label: string) => {
      const nameParts = label.trim().split(/\s+/);
      const firstName = nameParts[0] ?? label;
      const lastName = nameParts.slice(1).join(' ') || '—';
      onGrantsChange([
        ...grants,
        {
          employeeId,
          level: 'VIEW',
          expiresAt: null,
          employee: {
            id: employeeId,
            firstName,
            lastName,
            email: '',
          },
          grantedAt: new Date().toISOString(),
          grantedBy: null,
        },
      ]);
    },
    [grants, onGrantsChange],
  );

  const patchGrant = useCallback(
    (employeeId: string, patch: Partial<CredentialManualGrant>) => {
      onGrantsChange(grants.map((g) => (g.employeeId === employeeId ? { ...g, ...patch } : g)));
    },
    [grants, onGrantsChange],
  );

  return (
    <section className="grid gap-5" aria-label="Manual access">
      <p className="text-muted-foreground text-xs leading-relaxed">{inheritedSummary}</p>

      <RelationPickerField
        label="Add employee"
        entityKind="employee"
        value={null}
        selectionLabel={null}
        placeholder="Choose…"
        icon={<User size={12} />}
        onSearch={searchEmployees}
        onSelect={(id, label) => addEmployee(id, label)}
        listMaxHeightClass={RELATION_PICKER_DROPDOWN_LIST_SIX_ROWS_CLASS}
        maxResults={12}
        {...employeePicker}
      />

      <div className={RELATION_PICKER_CHIP_STACK_CLASS}>
        {grants.length === 0 ? (
          <p className="text-muted-foreground text-sm">No manual grants yet.</p>
        ) : (
          grants.map((grant) => (
            <CredentialManualAccessGrantRow
              key={grant.employeeId}
              grant={grant}
              onLevelChange={(employeeId, level) => patchGrant(employeeId, { level })}
              onExpiresAtChange={(employeeId, expiresAt) => patchGrant(employeeId, { expiresAt })}
              onRemove={(employeeId) =>
                onGrantsChange(grants.filter((g) => g.employeeId !== employeeId))
              }
            />
          ))
        )}
      </div>
    </section>
  );
}
