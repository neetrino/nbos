'use client';

import { useTranslations } from 'next-intl';
import { DetailSheetFieldSegmented, RelationPickerField } from '@/components/shared';
import { useRelationPickerActions } from '@/components/shared/relation-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { searchEmployeesForPicker } from '@/lib/employees';
import {
  rememberEmployeeAvatar,
  rememberEmployeeLabel,
} from '@/features/tasks/task-employee-labels';
import type { RecurringPriority, RecurringTaskFormDraft } from './recurring-task-form-state';

interface RecurringTaskIdentityFieldsProps {
  draft: RecurringTaskFormDraft;
  disabled: boolean;
  onPatch: (patch: Partial<RecurringTaskFormDraft>) => void;
}

export function RecurringTaskIdentityFields({
  draft,
  disabled,
  onPatch,
}: RecurringTaskIdentityFieldsProps) {
  const t = useTranslations('tasks');
  const assigneePicker = useRelationPickerActions('employee');

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="recurring-title">{t('recurring.titleLabel')}</Label>
        <Input
          id="recurring-title"
          value={draft.title}
          disabled={disabled}
          placeholder={t('recurring.titlePlaceholder')}
          onChange={(event) => onPatch({ title: event.target.value })}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="recurring-description">{t('recurring.descriptionLabel')}</Label>
        <Textarea
          id="recurring-description"
          value={draft.description}
          disabled={disabled}
          rows={3}
          placeholder={t('recurring.descriptionPlaceholder')}
          onChange={(event) => onPatch({ description: event.target.value })}
        />
      </div>

      <DetailSheetFieldSegmented
        label={t('recurring.priority')}
        value={draft.priority}
        disabled={disabled}
        options={[
          { value: 'NORMAL', label: t('priority.NORMAL') },
          { value: 'HIGH', label: t('priority.HIGH') },
        ]}
        onValueChange={(value) => onPatch({ priority: value as RecurringPriority })}
      />

      <RelationPickerField
        label={t('sheet.assignee')}
        entityKind="employee"
        value={draft.assigneeId}
        selectionLabel={draft.assigneeLabel}
        selectionAvatar={draft.assigneeAvatar}
        disabled={disabled}
        onSearch={searchEmployeesForPicker}
        onSelect={(employeeId, label, avatar) => {
          rememberEmployeeLabel(employeeId, label);
          rememberEmployeeAvatar(employeeId, avatar);
          onPatch({
            assigneeId: employeeId,
            assigneeLabel: label,
            assigneeAvatar: avatar?.trim() || null,
          });
        }}
        onClear={() => onPatch({ assigneeId: null, assigneeLabel: null, assigneeAvatar: null })}
        {...assigneePicker}
      />
    </div>
  );
}
