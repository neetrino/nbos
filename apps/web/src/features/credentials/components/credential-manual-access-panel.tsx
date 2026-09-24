'use client';

import { useCallback, useMemo } from 'react';
import { User, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DetailSheetSection, RelationPickerField } from '@/components/shared';
import {
  DETAIL_SHEET_SECTION_BODY_CLASS,
  RELATION_PICKER_CHIP_STACK_CLASS,
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
  const t = useTranslations('credentials');
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
    <section className="grid gap-4" aria-label={t('form.tabs.manualAccess')}>
      <p className="text-muted-foreground text-xs leading-relaxed">{inheritedSummary}</p>

      <DetailSheetSection title={t('form.sectionTeam')} icon={<Users size={12} />}>
        <div className={DETAIL_SHEET_SECTION_BODY_CLASS}>
          <RelationPickerField
            label={t('form.addEmployee')}
            entityKind="employee"
            value={null}
            selectionLabel={null}
            icon={<User size={12} />}
            onSearch={searchEmployees}
            onSelect={(id, label) => addEmployee(id, label)}
            maxResults={12}
            {...employeePicker}
          />

          <div className={RELATION_PICKER_CHIP_STACK_CLASS}>
            {grants.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t('form.noManualGrants')}</p>
            ) : (
              grants.map((grant) => (
                <CredentialManualAccessGrantRow
                  key={grant.employeeId}
                  grant={grant}
                  onLevelChange={(employeeId, level) => patchGrant(employeeId, { level })}
                  onExpiresAtChange={(employeeId, expiresAt) =>
                    patchGrant(employeeId, { expiresAt })
                  }
                  onRemove={(employeeId) =>
                    onGrantsChange(grants.filter((g) => g.employeeId !== employeeId))
                  }
                />
              ))
            )}
          </div>
        </div>
      </DetailSheetSection>
    </section>
  );
}
