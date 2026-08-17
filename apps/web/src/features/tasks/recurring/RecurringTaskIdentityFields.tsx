'use client';

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
  const assigneePicker = useRelationPickerActions('employee');

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="recurring-title">Title</Label>
        <Input
          id="recurring-title"
          value={draft.title}
          disabled={disabled}
          placeholder="e.g. Check domains"
          onChange={(event) => onPatch({ title: event.target.value })}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="recurring-description">Description</Label>
        <Textarea
          id="recurring-description"
          value={draft.description}
          disabled={disabled}
          rows={3}
          placeholder="What should the spawned task include?"
          onChange={(event) => onPatch({ description: event.target.value })}
        />
      </div>

      <DetailSheetFieldSegmented
        label="Priority"
        value={draft.priority}
        disabled={disabled}
        options={[
          { value: 'NORMAL', label: 'Normal' },
          { value: 'HIGH', label: 'Urgent' },
        ]}
        onValueChange={(value) => onPatch({ priority: value as RecurringPriority })}
      />

      <RelationPickerField
        label="Assignee"
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
