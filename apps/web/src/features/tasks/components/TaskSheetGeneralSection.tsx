import { Calendar, Copy, User, Users } from 'lucide-react';
import {
  EntityNotesField,
  ENTITY_NOTES_OPTIONAL_PLACEHOLDER,
  InlineField,
  RelationPickerField,
} from '@/components/shared';
import { cn } from '@/lib/utils';
import { useRelationPickerActions } from '@/components/shared/relation-picker';
import { Button } from '@/components/ui/button';
import type { Task } from '@/lib/api/tasks';
import type { TaskGeneralDraft } from '../task-general-form-state';
import {
  TASK_SHEET_CARD_CLASS,
  TASK_SHEET_META_BLOCK_CLASS,
  TASK_SHEET_TEAM_COLUMN_CLASS,
  TASK_SHEET_TEAM_COLUMNS_CLASS,
  TASK_SHEET_TEAM_DIVIDER_CLASS,
  TASK_SHEET_TEAM_META_GRID_CLASS,
  TASK_SHEET_TEAM_RIGHT_COLUMN_CLASS,
} from './task-sheet-classes';
import { formatTaskSheetDateTime } from './task-sheet-format';
import { TASK_SHEET_COMPACT_FIELD_CLASS, TaskSheetCompactRow } from './task-sheet-compact-row';
import { TaskFilesBlock } from './TaskFilesBlock';

interface TaskSheetGeneralSectionProps {
  task: Task;
  taskId: string;
  draft: TaskGeneralDraft;
  disabled?: boolean;
  onPatchDraft: (partial: Partial<TaskGeneralDraft>) => void;
  onSearchEmployees: (
    query: string,
  ) => Promise<Array<{ value: string; label: string; subtitle?: string }>>;
}

export function TaskSheetGeneralSection({
  task,
  taskId,
  draft,
  disabled = false,
  onPatchDraft,
  onSearchEmployees,
}: TaskSheetGeneralSectionProps) {
  const creatorPicker = useRelationPickerActions('employee', 'task-creator');
  const assigneePicker = useRelationPickerActions('employee', 'task-assignee');
  const assistantPicker = useRelationPickerActions('employee', 'task-assistant');
  const observerPicker = useRelationPickerActions('employee', 'task-observer');

  async function copyTaskCode() {
    try {
      await navigator.clipboard.writeText(task.code);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <>
      <section className={TASK_SHEET_CARD_CLASS}>
        <div className={TASK_SHEET_META_BLOCK_CLASS}>
          <div className={TASK_SHEET_TEAM_COLUMNS_CLASS}>
            <div className={cn(TASK_SHEET_TEAM_COLUMN_CLASS, TASK_SHEET_TEAM_META_GRID_CLASS)}>
              <TaskSheetCompactRow gridCells label="Creator">
                <RelationPickerField
                  label="Creator"
                  entityKind="employee"
                  value={draft.creatorId}
                  selectionLabel={draft.creatorLabel}
                  icon={<User size={13} />}
                  placeholder="Select creator…"
                  disabled={disabled}
                  className={TASK_SHEET_COMPACT_FIELD_CLASS}
                  onSearch={onSearchEmployees}
                  onSelect={(employeeId, label) =>
                    onPatchDraft({ creatorId: employeeId, creatorLabel: label })
                  }
                  {...creatorPicker}
                />
              </TaskSheetCompactRow>

              <TaskSheetCompactRow gridCells label="Assignee">
                <RelationPickerField
                  label="Assignee"
                  entityKind="employee"
                  value={draft.assigneeId}
                  selectionLabel={draft.assigneeLabel}
                  icon={<User size={13} />}
                  placeholder="Select assignee…"
                  disabled={disabled}
                  className={TASK_SHEET_COMPACT_FIELD_CLASS}
                  onSearch={onSearchEmployees}
                  onSelect={(employeeId, label) =>
                    onPatchDraft({ assigneeId: employeeId, assigneeLabel: label })
                  }
                  onClear={() => onPatchDraft({ assigneeId: null, assigneeLabel: null })}
                  {...assigneePicker}
                />
              </TaskSheetCompactRow>

              <TaskSheetCompactRow gridCells label="Deadline">
                <InlineField
                  variant="controlled"
                  label="Deadline"
                  value={draft.dueDate}
                  type="date"
                  datePickerVariant="extended"
                  datePickerMode="datetime"
                  icon={<Calendar size={13} />}
                  clearable
                  disabled={disabled}
                  className={TASK_SHEET_COMPACT_FIELD_CLASS}
                  onValueChange={(value) => onPatchDraft({ dueDate: value })}
                />
              </TaskSheetCompactRow>
            </div>

            <div className={TASK_SHEET_TEAM_DIVIDER_CLASS} role="presentation" />

            <div className={cn(TASK_SHEET_TEAM_COLUMN_CLASS, TASK_SHEET_TEAM_RIGHT_COLUMN_CLASS)}>
              <TaskSheetCompactRow
                label="Assistant"
                alignEnd
                hideLabel={draft.coAssigneeIds.length === 0}
              >
                <RelationPickerField
                  label="Assistant"
                  entityKind="employee"
                  multiple
                  value={draft.coAssigneeIds}
                  selectionLabels={draft.coAssigneeLabels}
                  icon={<Users size={13} />}
                  placeholder="Add assistant…"
                  disabled={disabled}
                  className={TASK_SHEET_COMPACT_FIELD_CLASS}
                  onSearch={onSearchEmployees}
                  onChange={(ids, labels) =>
                    onPatchDraft({ coAssigneeIds: ids, coAssigneeLabels: labels })
                  }
                  {...assistantPicker}
                />
              </TaskSheetCompactRow>

              <TaskSheetCompactRow
                label="Observer"
                alignEnd
                hideLabel={draft.observerIds.length === 0}
              >
                <RelationPickerField
                  label="Observer"
                  entityKind="employee"
                  multiple
                  value={draft.observerIds}
                  selectionLabels={draft.observerLabels}
                  icon={<Users size={13} />}
                  placeholder="Add observer…"
                  disabled={disabled}
                  className={TASK_SHEET_COMPACT_FIELD_CLASS}
                  onSearch={onSearchEmployees}
                  onChange={(ids, labels) =>
                    onPatchDraft({ observerIds: ids, observerLabels: labels })
                  }
                  {...observerPicker}
                />
              </TaskSheetCompactRow>

              <TaskSheetCompactRow label="Created" alignEnd>
                <div className="flex min-w-0 items-center gap-1.5 text-sm">
                  <span className="truncate">{formatTaskSheetDateTime(task.createdAt)}</span>
                  <span className="text-muted-foreground shrink-0">·</span>
                  <span className="text-muted-foreground shrink-0 font-mono text-xs">
                    {task.code}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="text-muted-foreground hover:text-foreground shrink-0"
                    title="Copy task code"
                    onClick={() => void copyTaskCode()}
                  >
                    <Copy size={12} aria-hidden />
                  </Button>
                </div>
              </TaskSheetCompactRow>
            </div>
          </div>
        </div>
      </section>

      <TaskFilesBlock taskId={taskId} />

      <EntityNotesField
        entityType="task"
        entityId={taskId}
        value={draft.description}
        onChange={(description) => onPatchDraft({ description })}
        placeholder={ENTITY_NOTES_OPTIONAL_PLACEHOLDER}
        disabled={disabled}
        shellClassName="[&_.entity-notes-prosemirror]:text-sm"
      />
    </>
  );
}
