'use client';

import { TASK_SHEET_CARD_CLASS } from './task-sheet-classes';
import { newEmptyChecklistId } from './task-checklist-helpers';
import { TaskChecklistCard } from './TaskChecklistCard';
import { TaskChecklistInlineAdd } from './TaskChecklistInlineAdd';
import type { Task } from '@/lib/api/tasks';

interface TaskChecklistSectionProps {
  task: Task;
  newChecklistTitle: string;
  newItemTexts: Record<string, string>;
  onNewChecklistTitleChange: (value: string) => void;
  onNewItemTextChange: (checklistId: string, value: string) => void;
  onAddChecklist: () => void;
  onAddItem: (checklistId: string) => void;
  onToggleItem: (checklistId: string, itemId: string) => void;
  onDeleteChecklist: (checklistId: string) => void;
  onDeleteItem: (checklistId: string, itemId: string) => void;
}

export function TaskChecklistSection({
  task,
  newChecklistTitle,
  newItemTexts,
  onNewChecklistTitleChange,
  onNewItemTextChange,
  onAddChecklist,
  onAddItem,
  onToggleItem,
  onDeleteChecklist,
  onDeleteItem,
}: TaskChecklistSectionProps) {
  const focusNewItemId = newEmptyChecklistId(task.checklists);

  return (
    <section className={TASK_SHEET_CARD_CLASS}>
      {task.checklists.map((checklist, index) => (
        <div
          key={checklist.id}
          className={index > 0 ? 'border-border/40 mt-3 border-t pt-3' : undefined}
        >
          <TaskChecklistCard
            checklist={checklist}
            newItemText={newItemTexts[checklist.id] ?? ''}
            autoStartItem={checklist.id === focusNewItemId}
            onNewItemTextChange={(value) => onNewItemTextChange(checklist.id, value)}
            onAddItem={() => onAddItem(checklist.id)}
            onToggleItem={(itemId) => onToggleItem(checklist.id, itemId)}
            onDeleteChecklist={() => onDeleteChecklist(checklist.id)}
            onDeleteItem={(itemId) => onDeleteItem(checklist.id, itemId)}
          />
        </div>
      ))}
      <div
        className={task.checklists.length > 0 ? 'border-border/40 mt-2 border-t pt-1' : undefined}
      >
        <TaskChecklistInlineAdd
          label="New checklist"
          placeholder="Name"
          value={newChecklistTitle}
          onChange={onNewChecklistTitleChange}
          onSubmit={onAddChecklist}
        />
      </div>
    </section>
  );
}
