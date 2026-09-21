'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { DELIVERY_COMPENSATION_ROLE_KEYS } from '@nbos/shared';
import { UserCog } from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  RelationPickerField,
  useEmployeeRelationSearch,
} from '@/components/shared/relation-picker';
import type { ReplacementPlanHolderDto } from '@/lib/api/delivery-configurations';
import { ROLE_LABEL_KEYS, UNSELECTED_ROLE } from './replace-assignee.constants';

type ReplaceAssigneeFieldsProps = {
  roleKey: string;
  holders: ReplacementPlanHolderDto[];
  fromEmployeeId: string;
  toEmployeeId: string;
  toEmployeeLabel: string | null;
  toEmployeeAvatar: string | null;
  reason: string;
  disabled: boolean;
  onRoleChange: (roleKey: string) => void;
  onFromEmployeeChange: (employeeId: string) => void;
  onIncomingSelect: (id: string, label: string, avatar?: string) => void;
  onIncomingClear: () => void;
  onReasonChange: (value: string) => void;
};

export function ReplaceAssigneeFields({
  roleKey,
  holders,
  fromEmployeeId,
  toEmployeeId,
  toEmployeeLabel,
  toEmployeeAvatar,
  reason,
  disabled,
  onRoleChange,
  onFromEmployeeChange,
  onIncomingSelect,
  onIncomingClear,
  onReasonChange,
}: ReplaceAssigneeFieldsProps) {
  const t = useTranslations('hr.functionCatalog');
  const excludeIncoming = useMemo(
    () => (fromEmployeeId ? new Set([fromEmployeeId]) : undefined),
    [fromEmployeeId],
  );
  const searchEmployees = useEmployeeRelationSearch(excludeIncoming);
  return (
    <>
      <RoleSelectField roleKey={roleKey} disabled={disabled} onRoleChange={onRoleChange} />
      <OutgoingHolderField
        holders={holders}
        fromEmployeeId={fromEmployeeId}
        disabled={disabled}
        onFromEmployeeChange={onFromEmployeeChange}
      />
      <RelationPickerField
        label={t('replaceAssignee.incoming')}
        entityKind="employee"
        value={toEmployeeId || null}
        selectionLabel={toEmployeeLabel}
        selectionAvatar={toEmployeeAvatar}
        icon={<UserCog size={12} />}
        disabled={disabled}
        onSearch={searchEmployees}
        onSelect={onIncomingSelect}
        onClear={onIncomingClear}
      />
      <div className="space-y-2">
        <Label htmlFor="replace-assignee-reason">{t('replaceAssignee.reason')}</Label>
        <Textarea
          id="replace-assignee-reason"
          value={reason}
          disabled={disabled}
          placeholder={t('replaceAssignee.reasonPlaceholder')}
          onChange={(event) => onReasonChange(event.target.value)}
        />
      </div>
    </>
  );
}

function RoleSelectField({
  roleKey,
  disabled,
  onRoleChange,
}: {
  roleKey: string;
  disabled: boolean;
  onRoleChange: (roleKey: string) => void;
}) {
  const t = useTranslations('hr.functionCatalog');
  return (
    <div className="space-y-2">
      <Label htmlFor="replace-assignee-role">{t('replaceAssignee.role')}</Label>
      <Select
        value={roleKey || undefined}
        disabled={disabled}
        onValueChange={(value) => {
          if (!value || value === UNSELECTED_ROLE) {
            return;
          }
          onRoleChange(value);
        }}
      >
        <SelectTrigger id="replace-assignee-role">
          <SelectValue placeholder={t('replaceAssignee.rolePlaceholder')} />
        </SelectTrigger>
        <SelectContent>
          {DELIVERY_COMPENSATION_ROLE_KEYS.map((key) => (
            <SelectItem key={key} value={key}>
              {t(ROLE_LABEL_KEYS[key])}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function OutgoingHolderField({
  holders,
  fromEmployeeId,
  disabled,
  onFromEmployeeChange,
}: {
  holders: ReplacementPlanHolderDto[];
  fromEmployeeId: string;
  disabled: boolean;
  onFromEmployeeChange: (employeeId: string) => void;
}) {
  const t = useTranslations('hr.functionCatalog');
  if (holders.length === 0) {
    return (
      <div className="space-y-2">
        <Label htmlFor="replace-assignee-outgoing">{t('replaceAssignee.outgoing')}</Label>
        <p id="replace-assignee-outgoing" className="text-muted-foreground text-sm">
          {t('replaceAssignee.noHolders')}
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <Label htmlFor="replace-assignee-outgoing">{t('replaceAssignee.outgoing')}</Label>
      <Select
        value={fromEmployeeId || undefined}
        disabled={disabled}
        onValueChange={(value) => {
          if (!value) {
            return;
          }
          onFromEmployeeChange(value);
        }}
      >
        <SelectTrigger id="replace-assignee-outgoing">
          <SelectValue placeholder={t('replaceAssignee.outgoingPlaceholder')} />
        </SelectTrigger>
        <SelectContent>
          {holders.map((holder) => (
            <SelectItem key={holder.employeeId} value={holder.employeeId}>
              {holder.employeeName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
