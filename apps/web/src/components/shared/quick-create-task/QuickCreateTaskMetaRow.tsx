'use client';

import { useTranslations } from 'next-intl';
import { InlineField, RelationPickerField } from '@/components/shared';
import {
  useRelationPickerActions,
  type RelationPickerSearchFn,
} from '@/components/shared/relation-picker';
import { cn } from '@/lib/utils';
import { TASK_SHEET_COMPACT_EMPLOYEE_FIELD_CLASS } from '@/features/tasks/components/task-sheet-compact-row';
import {
  QUICK_CREATE_TASK_META_GRID_CLASS,
  QUICK_CREATE_TASK_OUTLINED_LABEL_SURFACE_CLASS,
} from './quick-create-task-constants';

interface QuickCreateTaskMetaRowProps {
  assigneeId: string;
  assigneeLabel: string;
  assigneeAvatar: string | undefined;
  dueDate: string;
  disabled: boolean;
  onSearchEmployees: RelationPickerSearchFn;
  onSelectAssignee: (id: string, label: string, avatar?: string) => void;
  onDueDateChange: (value: string) => void;
}

/** Assignee + deadline — same outlined shells as the Task card, half-width each. */
export function QuickCreateTaskMetaRow({
  assigneeId,
  assigneeLabel,
  assigneeAvatar,
  dueDate,
  disabled,
  onSearchEmployees,
  onSelectAssignee,
  onDueDateChange,
}: QuickCreateTaskMetaRowProps) {
  const tForms = useTranslations('forms');
  const tTasks = useTranslations('tasks');
  const assigneePicker = useRelationPickerActions('employee');

  return (
    <div className={QUICK_CREATE_TASK_META_GRID_CLASS}>
      <RelationPickerField
        label={tForms('task.assignee')}
        entityKind="employee"
        value={assigneeId || null}
        selectionLabel={assigneeLabel || null}
        selectionAvatar={assigneeAvatar}
        disabled={disabled}
        className={cn(
          TASK_SHEET_COMPACT_EMPLOYEE_FIELD_CLASS,
          QUICK_CREATE_TASK_OUTLINED_LABEL_SURFACE_CLASS,
        )}
        onSearch={onSearchEmployees}
        onSelect={onSelectAssignee}
        onClear={() => onSelectAssignee('', '', undefined)}
        {...assigneePicker}
      />
      <InlineField
        variant="controlled"
        label={tTasks('sheet.deadline')}
        value={dueDate}
        type="date"
        datePickerVariant="extended"
        datePickerMode="datetime"
        clearable
        disabled={disabled}
        className={QUICK_CREATE_TASK_OUTLINED_LABEL_SURFACE_CLASS}
        onValueChange={onDueDateChange}
      />
    </div>
  );
}
