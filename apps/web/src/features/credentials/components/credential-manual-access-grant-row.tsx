'use client';

import { useTranslations } from 'next-intl';
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
import {
  CREDENTIAL_GRANT_LEVEL_GHOST_CLASS,
  CREDENTIAL_GRANT_TRAILING_GAP_CLASS,
} from '@/features/credentials/constants/credential-manual-access-ui';
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
  const t = useTranslations('credentials');
  const relations = useEntityRelations();
  const dateValue = grant.expiresAt ? grant.expiresAt.slice(0, 10) : '';
  const label = `${grant.employee.firstName} ${grant.employee.lastName}`.trim();

  return (
    <RelationPickerChip
      label={label}
      subtitle={grant.employee.email || null}
      entityKind="employee"
      imageUrl={grant.employee.avatar}
      onOpen={() => void relations.openEntity('employee', grant.employeeId)}
      onClear={() => onRemove(grant.employeeId)}
      trailing={
        <span className={CREDENTIAL_GRANT_TRAILING_GAP_CLASS}>
          <NbosDatePicker
            variant="compact"
            mode="date"
            embedded
            iconButtonShell
            value={dateValue}
            clearable
            aria-label={t('form.grantExpiresAria', { name: label })}
            className="shrink-0"
            onChange={(next) => {
              const trimmed = next.trim();
              onExpiresAtChange(grant.employeeId, trimmed ? `${trimmed}T23:59:59.999Z` : null);
            }}
          />
          <Select
            value={grant.level}
            onValueChange={(value) => {
              if (value === 'VIEW' || value === 'EDIT') onLevelChange(grant.employeeId, value);
            }}
          >
            <SelectTrigger
              size="sm"
              className={CREDENTIAL_GRANT_LEVEL_GHOST_CLASS}
              aria-label={t('form.grantAccessAria', { name: label })}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="VIEW">{t('form.grantView')}</SelectItem>
              <SelectItem value="EDIT">{t('form.grantEdit')}</SelectItem>
            </SelectContent>
          </Select>
        </span>
      }
    />
  );
}
