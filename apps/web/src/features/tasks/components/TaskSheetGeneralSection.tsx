import type { ReactNode } from 'react';
import { Calendar, ClipboardList, CircleDot, Flag, User } from 'lucide-react';
import { InlineField } from '@/components/shared';
import { SearchField } from '@/components/shared/SearchField';
import { TASK_PRIORITIES, TASK_STATUSES } from '../constants/tasks';
import type { TaskGeneralDraft } from '../task-general-form-state';
import { TASK_SHEET_SECTION_SURFACE_CLASS } from './task-sheet-classes';

interface TaskSheetGeneralSectionProps {
  draft: TaskGeneralDraft;
  saving: boolean;
  onPatchDraft: (partial: Partial<TaskGeneralDraft>) => void;
  onSearchEmployees: (
    query: string,
  ) => Promise<Array<{ value: string; label: string; subtitle?: string }>>;
}

export function TaskSheetGeneralSection({
  draft,
  saving,
  onPatchDraft,
  onSearchEmployees,
}: TaskSheetGeneralSectionProps) {
  return (
    <section className={TASK_SHEET_SECTION_SURFACE_CLASS}>
      <div className="grid gap-x-5 gap-y-4 lg:grid-cols-2">
        <InlineField
          variant="controlled"
          label="Title"
          value={draft.title}
          icon={<ClipboardList size={13} />}
          disabled={saving}
          onValueChange={(value) => onPatchDraft({ title: value })}
        />
        <InlineField
          variant="controlled"
          label="Status"
          value={draft.status}
          type="select"
          icon={<CircleDot size={13} />}
          options={TASK_STATUSES.map((item) => ({ value: item.value, label: item.label }))}
          disabled={saving}
          onValueChange={(value) => onPatchDraft({ status: value })}
        />
        <InlineField
          variant="controlled"
          label="Priority"
          value={draft.priority}
          type="select"
          icon={<Flag size={13} />}
          options={TASK_PRIORITIES.map((item) => ({ value: item.value, label: item.label }))}
          disabled={saving}
          onValueChange={(value) => onPatchDraft({ priority: value })}
        />
        <InlineField
          variant="controlled"
          label="Start Date"
          value={draft.startDate}
          type="date"
          icon={<Calendar size={13} />}
          clearable
          disabled={saving}
          onValueChange={(value) => onPatchDraft({ startDate: value })}
        />
        <InlineField
          variant="controlled"
          label="Due Date"
          value={draft.dueDate}
          type="date"
          datePickerVariant="extended"
          icon={<Calendar size={13} />}
          clearable
          disabled={saving}
          onValueChange={(value) => onPatchDraft({ dueDate: value })}
        />
        <SearchField
          selectionMode="stage"
          label="Assignee"
          value={draft.assigneeId}
          icon={<User size={13} />}
          displayValue={
            draft.assigneeLabel ? <PersonPill>{draft.assigneeLabel}</PersonPill> : undefined
          }
          placeholder="Assign employee"
          disabled={saving}
          onSearch={onSearchEmployees}
          onStageSelect={(employeeId, label) =>
            onPatchDraft({ assigneeId: employeeId, assigneeLabel: label })
          }
          onClear={() => onPatchDraft({ assigneeId: null, assigneeLabel: null })}
        />
        <InlineField
          variant="controlled"
          label="Description"
          value={draft.description ?? ''}
          type="textarea"
          placeholder="Add description"
          className="lg:col-span-2"
          disabled={saving}
          onValueChange={(value) => onPatchDraft({ description: value.trim() ? value : null })}
        />
      </div>
    </section>
  );
}

function PersonPill({ children }: { children: ReactNode }) {
  return <span className="text-foreground font-medium">{children}</span>;
}
