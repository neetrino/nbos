import { Copy } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { resolveDatePickerLocale } from '@/components/shared/date-picker/date-picker-locale';
import {
  DetailSheetOptionalDescriptionField,
  InlineField,
  RelationPickerField,
} from '@/components/shared';
import { cn } from '@/lib/utils';
import { useRelationPickerActions } from '@/components/shared/relation-picker';
import { Button } from '@/components/ui/button';
import type { Task } from '@/lib/api/tasks';
import {
  rememberEmployeeAvatar,
  rememberEmployeeAvatars,
  rememberEmployeeLabel,
  rememberEmployeeLabels,
} from '../task-employee-labels';
import type { TaskGeneralDraft } from '../task-general-form-state';
import {
  TASK_SHEET_CARD_CLASS,
  TASK_SHEET_META_BLOCK_CLASS,
  TASK_SHEET_OUTLINED_STATIC_SHELL_CLASS,
  TASK_SHEET_TEAM_COLUMN_CLASS,
  TASK_SHEET_TEAM_COLUMNS_CLASS,
  TASK_SHEET_TEAM_DIVIDER_CLASS,
  TASK_SHEET_TEAM_META_GRID_CLASS,
  TASK_SHEET_TEAM_RIGHT_COLUMN_CLASS,
} from './task-sheet-classes';
import { formatTaskSheetDateTime } from './task-sheet-format';
import {
  TASK_SHEET_COMPACT_EMPLOYEE_FIELD_CLASS,
  TaskSheetCompactRow,
} from './task-sheet-compact-row';
import { TaskFilesBlock } from './TaskFilesBlock';
import { TaskLinkedEntitiesSection } from './TaskLinkedEntitiesSection';

interface TaskSheetGeneralSectionProps {
  task: Task;
  taskId: string;
  draft: TaskGeneralDraft;
  disabled?: boolean;
  onPatchDraft: (partial: Partial<TaskGeneralDraft>) => void;
  onLinksChange: (links: Task['links']) => void;
  onTaskChange: (task: Task) => void;
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
  onLinksChange,
  onTaskChange,
  onSearchEmployees,
}: TaskSheetGeneralSectionProps) {
  const t = useTranslations('tasks');
  const dateLocale = resolveDatePickerLocale(useLocale());
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

  const createdAtLabel = formatTaskSheetDateTime(task.createdAt, dateLocale);

  return (
    <>
      <DetailSheetOptionalDescriptionField
        entityType="task"
        entityId={taskId}
        value={draft.description}
        onChange={(description) => onPatchDraft({ description })}
        disabled={disabled}
        label={null}
        placeholder={t('sheet.description')}
        shellClassName="[&_.entity-notes-prosemirror]:text-sm"
      />

      <section className={TASK_SHEET_CARD_CLASS}>
        <div className={TASK_SHEET_META_BLOCK_CLASS}>
          <div className={TASK_SHEET_TEAM_COLUMNS_CLASS}>
            <div className={cn(TASK_SHEET_TEAM_COLUMN_CLASS, TASK_SHEET_TEAM_META_GRID_CLASS)}>
              <TaskSheetCompactRow hideLabel label={t('sheet.creator')}>
                <RelationPickerField
                  label={t('sheet.creator')}
                  entityKind="employee"
                  value={draft.creatorId}
                  selectionLabel={draft.creatorLabel}
                  selectionAvatar={draft.creatorAvatar}
                  disabled={disabled}
                  className={TASK_SHEET_COMPACT_EMPLOYEE_FIELD_CLASS}
                  onSearch={onSearchEmployees}
                  onSelect={(employeeId, label, avatar) => {
                    rememberEmployeeLabel(employeeId, label);
                    rememberEmployeeAvatar(employeeId, avatar);
                    onPatchDraft({
                      creatorId: employeeId,
                      creatorLabel: label,
                      creatorAvatar: avatar?.trim() || null,
                    });
                  }}
                  {...creatorPicker}
                />
              </TaskSheetCompactRow>

              <TaskSheetCompactRow hideLabel label={t('sheet.assignee')}>
                <RelationPickerField
                  label={t('sheet.assignee')}
                  entityKind="employee"
                  value={draft.assigneeId}
                  selectionLabel={draft.assigneeLabel}
                  selectionAvatar={draft.assigneeAvatar}
                  disabled={disabled}
                  className={TASK_SHEET_COMPACT_EMPLOYEE_FIELD_CLASS}
                  onSearch={onSearchEmployees}
                  onSelect={(employeeId, label, avatar) => {
                    rememberEmployeeLabel(employeeId, label);
                    rememberEmployeeAvatar(employeeId, avatar);
                    onPatchDraft({
                      assigneeId: employeeId,
                      assigneeLabel: label,
                      assigneeAvatar: avatar?.trim() || null,
                    });
                  }}
                  onClear={() =>
                    onPatchDraft({
                      assigneeId: null,
                      assigneeLabel: null,
                      assigneeAvatar: null,
                    })
                  }
                  {...assigneePicker}
                />
              </TaskSheetCompactRow>

              <TaskSheetCompactRow hideLabel label={t('sheet.deadline')}>
                <InlineField
                  variant="controlled"
                  label={t('sheet.deadline')}
                  value={draft.dueDate}
                  type="date"
                  datePickerVariant="extended"
                  datePickerMode="datetime"
                  clearable
                  disabled={disabled}
                  onValueChange={(value) => onPatchDraft({ dueDate: value })}
                />
              </TaskSheetCompactRow>
            </div>

            <div className={TASK_SHEET_TEAM_DIVIDER_CLASS} role="presentation" />

            <div
              className={cn(
                TASK_SHEET_TEAM_COLUMN_CLASS,
                TASK_SHEET_TEAM_META_GRID_CLASS,
                TASK_SHEET_TEAM_RIGHT_COLUMN_CLASS,
              )}
            >
              <TaskSheetCompactRow hideLabel label={t('sheet.assistant')}>
                <RelationPickerField
                  label={t('sheet.assistant')}
                  entityKind="employee"
                  multiple
                  value={draft.coAssigneeIds}
                  selectionLabels={draft.coAssigneeLabels}
                  selectionAvatars={draft.coAssigneeAvatars}
                  disabled={disabled}
                  className={TASK_SHEET_COMPACT_EMPLOYEE_FIELD_CLASS}
                  onSearch={onSearchEmployees}
                  onChange={(ids, labels, avatars) => {
                    rememberEmployeeLabels(labels);
                    if (avatars) rememberEmployeeAvatars(avatars);
                    onPatchDraft({
                      coAssigneeIds: ids,
                      coAssigneeLabels: labels,
                      coAssigneeAvatars: avatars ?? {},
                    });
                  }}
                  {...assistantPicker}
                />
              </TaskSheetCompactRow>

              <TaskSheetCompactRow hideLabel label={t('sheet.observer')}>
                <RelationPickerField
                  label={t('sheet.observer')}
                  entityKind="employee"
                  multiple
                  value={draft.observerIds}
                  selectionLabels={draft.observerLabels}
                  selectionAvatars={draft.observerAvatars}
                  disabled={disabled}
                  className={TASK_SHEET_COMPACT_EMPLOYEE_FIELD_CLASS}
                  onSearch={onSearchEmployees}
                  onChange={(ids, labels, avatars) => {
                    rememberEmployeeLabels(labels);
                    if (avatars) rememberEmployeeAvatars(avatars);
                    onPatchDraft({
                      observerIds: ids,
                      observerLabels: labels,
                      observerAvatars: avatars ?? {},
                    });
                  }}
                  {...observerPicker}
                />
              </TaskSheetCompactRow>

              <TaskSheetCompactRow label={t('sheet.created')}>
                <div className={TASK_SHEET_OUTLINED_STATIC_SHELL_CLASS}>
                  <span className="min-w-0 flex-1 truncate" title={createdAtLabel}>
                    {createdAtLabel}
                  </span>
                  <span className="text-muted-foreground shrink-0">·</span>
                  <span
                    className="text-muted-foreground min-w-0 flex-1 truncate font-mono text-xs"
                    title={task.code}
                  >
                    {task.code}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="text-muted-foreground hover:text-foreground shrink-0"
                    title={t('sheet.copyCode')}
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

      <TaskLinkedEntitiesSection
        task={task}
        disabled={disabled}
        onLinksChange={onLinksChange}
        onTaskChange={onTaskChange}
      />

      <TaskFilesBlock taskId={taskId} />
    </>
  );
}
