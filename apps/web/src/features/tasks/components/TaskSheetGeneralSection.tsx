import { Calendar, Copy, User, Users } from 'lucide-react';
import { EntityNotesField, InlineField, RelationPickerField } from '@/components/shared';
import { useRelationPickerActions } from '@/components/shared/relation-picker';
import { Button } from '@/components/ui/button';
import type { Task } from '@/lib/api/tasks';
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
              {...creatorPicker}
            />
          </TaskSheetCompactRow>

          <TaskSheetCompactRow label="Assignee">
            <RelationPickerField
              label="Assignee"
              entityKind="employee"
              value={draft.assigneeId}
              selectionLabel={draft.assigneeLabel}
              icon={<User size={13} />}
              placeholder="Select assignee…"
              disabled={saving}
              className={TASK_SHEET_COMPACT_FIELD_CLASS}
              onSearch={onSearchEmployees}
              onSelect={(employeeId, label) =>
                onPatchDraft({ assigneeId: employeeId, assigneeLabel: label })
              }
              onClear={() => onPatchDraft({ assigneeId: null, assigneeLabel: null })}
              {...assigneePicker}
            />
          </TaskSheetCompactRow>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 py-1">
            <TaskSheetCompactRow label="Assistant" className="py-0">
              <RelationPickerField
                label="Assistant"
                entityKind="employee"
                multiple
                value={draft.coAssigneeIds}
                selectionLabels={draft.coAssigneeLabels}
                icon={<Users size={13} />}
                placeholder="Add assistant…"
                disabled={saving}
                className={TASK_SHEET_COMPACT_FIELD_CLASS}
                onSearch={onSearchEmployees}
                onChange={(ids, labels) =>
                  onPatchDraft({ coAssigneeIds: ids, coAssigneeLabels: labels })
                }
                {...assistantPicker}
              />
            </TaskSheetCompactRow>

            <TaskSheetCompactRow label="Observer" className="py-0">
              <RelationPickerField
                label="Observer"
                entityKind="employee"
                multiple
                value={draft.observerIds}
                selectionLabels={draft.observerLabels}
                icon={<Users size={13} />}
                placeholder="Add observer…"
                disabled={saving}
                className={TASK_SHEET_COMPACT_FIELD_CLASS}
                onSearch={onSearchEmployees}
                onChange={(ids, labels) =>
                  onPatchDraft({ observerIds: ids, observerLabels: labels })
                }
                {...observerPicker}
              />
            </TaskSheetCompactRow>
          </div>

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
