'use client';

import { TASK_SHEET_CARD_CLASS } from './task-sheet-classes';
import { newEmptyChecklistId } from './task-checklist-helpers';
import { TaskChecklistCard } from './TaskChecklistCard';
import { TaskChecklistAddTrigger } from './TaskChecklistInlineAdd';
import type { Task } from '@/lib/api/tasks';

interface TaskChecklistSectionProps {
  task: Task;
  newItemTexts: Record<string, string>;
  disabled?: boolean;
  onNewItemTextChange: (checklistId: string, value: string) => void;
  onAddChecklist: () => void;
  onAddItem: (checklistId: string) => void;
  onToggleItem: (checklistId: string, itemId: string) => void;
  onDeleteChecklist: (checklistId: string) => void;
  onDeleteItem: (checklistId: string, itemId: string) => void;
  onRenameTitle: (checklistId: string, title: string) => Promise<void>;
  onRenameItem: (checklistId: string, itemId: string, text: string) => Promise<void>;
}

export function TaskChecklistSection({
  task,
  newItemTexts,
  disabled = false,
  onNewItemTextChange,
  onAddChecklist,
  onAddItem,
  onToggleItem,
  onDeleteChecklist,
  onDeleteItem,
  onRenameTitle,
  onRenameItem,
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
            autoStartItem={!disabled && checklist.id === focusNewItemId}
            disabled={disabled}
            onNewItemTextChange={(value) => onNewItemTextChange(checklist.id, value)}
            onAddItem={() => onAddItem(checklist.id)}
            onToggleItem={(itemId) => onToggleItem(checklist.id, itemId)}
            onDeleteChecklist={() => onDeleteChecklist(checklist.id)}
            onDeleteItem={(itemId) => onDeleteItem(checklist.id, itemId)}
            onRenameTitle={(title) => onRenameTitle(checklist.id, title)}
            onRenameItem={(itemId, text) => onRenameItem(checklist.id, itemId, text)}
          />
        </div>
      ))}
      {disabled ? null : <TaskChecklistAddTrigger label="New checklist" onClick={onAddChecklist} />}
    </section>
  );
}
