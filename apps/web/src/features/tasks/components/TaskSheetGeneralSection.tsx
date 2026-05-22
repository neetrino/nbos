import { Calendar, Copy, Flag, User } from 'lucide-react';
import { EntityNotesField, InlineField, RelationPickerField } from '@/components/shared';
import { useRelationPickerActions } from '@/components/shared/relation-picker';
import { Button } from '@/components/ui/button';
import type { Task } from '@/lib/api/tasks';
import { TASK_PRIORITIES } from '../constants/tasks';
import type { TaskGeneralDraft } from '../task-general-form-state';
import { TASK_SHEET_CARD_CLASS, TASK_SHEET_META_BLOCK_CLASS } from './task-sheet-classes';
import { formatTaskSheetDateTime } from './task-sheet-format';
import { TASK_SHEET_COMPACT_FIELD_CLASS, TaskSheetCompactRow } from './task-sheet-compact-row';
import { TaskFilesBlock } from './TaskFilesBlock';

interface TaskSheetGeneralSectionProps {
  task: Task;
  taskId: string;
  draft: TaskGeneralDraft;
  saving: boolean;
  onPatchDraft: (partial: Partial<TaskGeneralDraft>) => void;
  onSearchEmployees: (
    query: string,
  ) => Promise<Array<{ value: string; label: string; subtitle?: string }>>;
}

export function TaskSheetGeneralSection({
  task,
  taskId,
  draft,
  saving,
  onPatchDraft,
  onSearchEmployees,
}: TaskSheetGeneralSectionProps) {
  const employeePicker = useRelationPickerActions('employee');
  const samePerson = Boolean(draft.assigneeId) && draft.creatorId === draft.assigneeId;

  async function copyTaskCode() {
    try {
      await navigator.clipboard.writeText(task.code);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <>
      <EntityNotesField
        entityType="task"
        entityId={taskId}
        value={draft.description}
        onChange={(description) => onPatchDraft({ description })}
        placeholder="Description"
        disabled={saving}
        shellClassName="[&_.entity-notes-prosemirror]:text-sm"
      />

      <section className={TASK_SHEET_CARD_CLASS}>
        <div className={TASK_SHEET_META_BLOCK_CLASS}>
          {samePerson ? (
            <TaskSheetCompactRow label="Creator & assignee">
              <RelationPickerField
                label="Creator & assignee"
                entityKind="employee"
                value={draft.creatorId}
                selectionLabel={draft.creatorLabel}
                icon={<User size={13} />}
                placeholder="Select person…"
                disabled={saving}
                className={TASK_SHEET_COMPACT_FIELD_CLASS}
                onSearch={onSearchEmployees}
                onSelect={(employeeId, label) =>
                  onPatchDraft({
                    creatorId: employeeId,
                    creatorLabel: label,
                    assigneeId: employeeId,
                    assigneeLabel: label,
                  })
                }
                {...employeePicker}
              />
            </TaskSheetCompactRow>
          ) : (
            <>
              <TaskSheetCompactRow label="Creator">
                <RelationPickerField
                  label="Creator"
                  entityKind="employee"
                  value={draft.creatorId}
                  selectionLabel={draft.creatorLabel}
                  icon={<User size={13} />}
                  placeholder="Select creator…"
                  disabled={saving}
                  className={TASK_SHEET_COMPACT_FIELD_CLASS}
                  onSearch={onSearchEmployees}
                  onSelect={(employeeId, label) =>
                    onPatchDraft({ creatorId: employeeId, creatorLabel: label })
                  }
                  {...employeePicker}
                />
              </TaskSheetCompactRow>
              <TaskSheetCompactRow label="Assignee">
                <RelationPickerField
                  label="Assignee"
                  entityKind="employee"
                  value={draft.assigneeId}
                  selectionLabel={draft.assigneeLabel}
                  icon={<User size={13} />}
                  placeholder="Assign employee"
                  disabled={saving}
                  className={TASK_SHEET_COMPACT_FIELD_CLASS}
                  onSearch={onSearchEmployees}
                  onSelect={(employeeId, label) =>
                    onPatchDraft({ assigneeId: employeeId, assigneeLabel: label })
                  }
                  onClear={() => onPatchDraft({ assigneeId: null, assigneeLabel: null })}
                  {...employeePicker}
                />
              </TaskSheetCompactRow>
            </>
          )}

          <TaskSheetCompactRow label="Deadline">
            <InlineField
              variant="controlled"
              label="Deadline"
              value={draft.dueDate}
              type="date"
              datePickerVariant="extended"
              datePickerMode="datetime"
              icon={<Calendar size={13} />}
              clearable
              disabled={saving}
              className={TASK_SHEET_COMPACT_FIELD_CLASS}
              onValueChange={(value) => onPatchDraft({ dueDate: value })}
            />
          </TaskSheetCompactRow>

          <TaskSheetCompactRow label="Priority">
            <InlineField
              variant="controlled"
              label="Priority"
              value={draft.priority}
              type="select"
              icon={<Flag size={13} />}
              options={TASK_PRIORITIES.map((item) => ({ value: item.value, label: item.label }))}
              disabled={saving}
              className={TASK_SHEET_COMPACT_FIELD_CLASS}
              onValueChange={(value) => onPatchDraft({ priority: value })}
            />
          </TaskSheetCompactRow>

          <TaskSheetCompactRow label="Created">
            <div className="flex min-w-0 items-center gap-1.5 text-sm">
              <span className="truncate">{formatTaskSheetDateTime(task.createdAt)}</span>
              <span className="text-muted-foreground shrink-0">·</span>
              <span className="text-muted-foreground shrink-0 font-mono text-xs">{task.code}</span>
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
      </section>

      <section className={TASK_SHEET_CARD_CLASS}>
        <TaskFilesBlock taskId={taskId} />
      </section>
    </>
  );
}
