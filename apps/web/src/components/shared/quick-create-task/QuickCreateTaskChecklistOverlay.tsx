'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  BOTTOM_SHEET_LAYER_ATTR,
  BOTTOM_SHEET_LAYER_CLOSE_ATTR,
  BOTTOM_SHEET_SWIPE_SCROLL_ATTR,
} from '@/components/layout/bottom-sheet-swipe';
import { TaskChecklistAddTrigger } from '@/features/tasks/components/TaskChecklistInlineAdd';
import { TaskChecklistCard } from '@/features/tasks/components/TaskChecklistCard';
import type { TaskChecklist } from '@/lib/api/tasks';
import {
  addQuickCreateChecklistItem,
  createQuickCreateChecklist,
  removeQuickCreateChecklistItem,
  renameQuickCreateChecklist,
  renameQuickCreateChecklistItem,
  toggleQuickCreateChecklistItem,
} from './quick-create-checklist-draft';
import { QUICK_CREATE_TASK_CHECKLIST_LAYER_CLASS } from './quick-create-task-constants';
import type { QuickCreateDraftChecklist } from './quick-create-task-extras';

interface QuickCreateTaskChecklistOverlayProps {
  checklists: QuickCreateDraftChecklist[];
  disabled: boolean;
  onChange: (checklists: QuickCreateDraftChecklist[]) => void;
  onClose: () => void;
}

export function QuickCreateTaskChecklistOverlay({
  checklists,
  disabled,
  onChange,
  onClose,
}: QuickCreateTaskChecklistOverlayProps) {
  const t = useTranslations('tasks');
  const tForms = useTranslations('forms');
  const tCommon = useTranslations('common');
  const [newItemTexts, setNewItemTexts] = useState<Record<string, string>>({});

  return (
    <div
      className={QUICK_CREATE_TASK_CHECKLIST_LAYER_CLASS}
      role="region"
      aria-label={tForms('task.checklists')}
      {...{ [BOTTOM_SHEET_LAYER_ATTR]: '' }}
    >
      <div className="flex shrink-0 items-center justify-end px-3 pt-2">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground/75 size-8 rounded-full"
          aria-label={tCommon('close')}
          disabled={disabled}
          {...{ [BOTTOM_SHEET_LAYER_CLOSE_ATTR]: '' }}
          onClick={onClose}
        >
          <X size={19} strokeWidth={1.75} aria-hidden />
        </Button>
      </div>
      <div
        className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 sm:px-4"
        {...{ [BOTTOM_SHEET_SWIPE_SCROLL_ATTR]: '' }}
      >
        {checklists.map((list, index) => (
          <ChecklistDraftCard
            key={list.localId}
            list={list}
            showDivider={index > 0}
            disabled={disabled}
            newItemText={newItemTexts[list.localId] ?? ''}
            onNewItemTextChange={(value) =>
              setNewItemTexts((current) => ({ ...current, [list.localId]: value }))
            }
            onChange={onChange}
            lists={checklists}
          />
        ))}
      </div>
      <div className="flex items-center gap-2 px-3 py-3 sm:px-4">
        {disabled ? null : (
          <div className="min-w-0 flex-1">
            <TaskChecklistAddTrigger
              label={t('sheet.checklist.new')}
              onClick={() => onChange([...checklists, createQuickCreateChecklist(checklists)])}
            />
          </div>
        )}
        <Button type="button" size="sm" className="ml-auto h-9 rounded-lg px-5" onClick={onClose}>
          {tCommon('save')}
        </Button>
      </div>
    </div>
  );
}

function ChecklistDraftCard({
  list,
  lists,
  showDivider,
  disabled,
  newItemText,
  onNewItemTextChange,
  onChange,
}: {
  list: QuickCreateDraftChecklist;
  lists: QuickCreateDraftChecklist[];
  showDivider: boolean;
  disabled: boolean;
  newItemText: string;
  onNewItemTextChange: (value: string) => void;
  onChange: (checklists: QuickCreateDraftChecklist[]) => void;
}) {
  return (
    <div className={showDivider ? 'border-border/40 mt-3 border-t pt-3' : undefined}>
      <TaskChecklistCard
        checklist={toTaskChecklist(list)}
        newItemText={newItemText}
        autoStartItem={!disabled && list.items.length === 0}
        disabled={disabled}
        onNewItemTextChange={onNewItemTextChange}
        onAddItem={() => {
          onChange(addQuickCreateChecklistItem(lists, list.localId, newItemText));
          onNewItemTextChange('');
        }}
        onToggleItem={(itemId) =>
          onChange(toggleQuickCreateChecklistItem(lists, list.localId, itemId))
        }
        onDeleteChecklist={() => onChange(lists.filter((entry) => entry.localId !== list.localId))}
        onDeleteItem={(itemId) =>
          onChange(removeQuickCreateChecklistItem(lists, list.localId, itemId))
        }
        onRenameTitle={async (title) =>
          onChange(renameQuickCreateChecklist(lists, list.localId, title))
        }
        onRenameItem={async (itemId, text) =>
          onChange(renameQuickCreateChecklistItem(lists, list.localId, itemId, text))
        }
      />
    </div>
  );
}

function toTaskChecklist(list: QuickCreateDraftChecklist): TaskChecklist {
  return {
    id: list.localId,
    taskId: 'draft',
    title: list.title,
    createdAt: new Date(0).toISOString(),
    items: list.items.map((item, index) => ({
      id: item.localId,
      checklistId: list.localId,
      text: item.text,
      checked: item.checked,
      sortOrder: index,
    })),
  };
}
