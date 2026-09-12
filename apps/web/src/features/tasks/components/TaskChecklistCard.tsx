'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronUp, Eye, EyeOff, ListChecks, MoreHorizontal, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { Task, TaskChecklistItem } from '@/lib/api/tasks';
import { visibleChecklistItems } from './task-checklist-helpers';
import { TaskChecklistInlineAdd } from './TaskChecklistInlineAdd';
import { TaskChecklistInlineText } from './TaskChecklistInlineText';

const HEADER_ICON_BTN_CLASS =
  'text-muted-foreground hover:text-foreground flex size-7 shrink-0 items-center justify-center rounded-md';

interface TaskChecklistCardProps {
  checklist: Task['checklists'][number];
  newItemText: string;
  autoStartItem: boolean;
  onNewItemTextChange: (value: string) => void;
  onAddItem: () => void;
  onToggleItem: (itemId: string) => void;
  onDeleteChecklist: () => void;
  onDeleteItem: (itemId: string) => void;
  onRenameTitle: (title: string) => Promise<void>;
  onRenameItem: (itemId: string, text: string) => Promise<void>;
  disabled?: boolean;
}

export function TaskChecklistCard({
  checklist,
  newItemText,
  autoStartItem,
  onNewItemTextChange,
  onAddItem,
  onToggleItem,
  onDeleteChecklist,
  onDeleteItem,
  onRenameTitle,
  onRenameItem,
  disabled = false,
}: TaskChecklistCardProps) {
  const t = useTranslations('tasks');
  const [collapsed, setCollapsed] = useState(false);
  const [hideCompleted, setHideCompleted] = useState(false);
  const done = checklist.items.filter((item) => item.checked).length;
  const total = checklist.items.length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;
  const items = visibleChecklistItems(checklist.items, hideCompleted);

  return (
    <div>
      <ChecklistHeader
        title={checklist.title}
        done={done}
        total={total}
        collapsed={collapsed}
        hideCompleted={hideCompleted}
        onToggleCollapsed={() => setCollapsed((prev) => !prev)}
        onHideCompleted={() => setHideCompleted((prev) => !prev)}
        onDelete={onDeleteChecklist}
        onRenameTitle={onRenameTitle}
        disabled={disabled}
      />

      {total > 0 && !collapsed ? <Progress value={progress} className="mt-2" /> : null}

      {collapsed ? null : (
        <div className="mt-2">
          {items.length > 0 ? (
            <div className="space-y-0.5">
              {items.map((item) => (
                <ChecklistItem
                  key={item.id}
                  item={item}
                  disabled={disabled}
                  onToggleItem={onToggleItem}
                  onDeleteItem={onDeleteItem}
                  onRenameItem={onRenameItem}
                />
              ))}
            </div>
          ) : null}
          {disabled ? null : (
            <TaskChecklistInlineAdd
              label={t('sheet.checklist.addItem')}
              placeholder={t('sheet.checklist.itemPlaceholder')}
              value={newItemText}
              autoStart={autoStartItem}
              stayOpenOnSubmit
              onChange={onNewItemTextChange}
              onSubmit={onAddItem}
            />
          )}
        </div>
      )}
    </div>
  );
}

interface ChecklistHeaderProps {
  title: string;
  done: number;
  total: number;
  collapsed: boolean;
  hideCompleted: boolean;
  onToggleCollapsed: () => void;
  onHideCompleted: () => void;
  onDelete: () => void;
  onRenameTitle: (title: string) => Promise<void>;
  disabled: boolean;
}

function ChecklistHeader({
  title,
  done,
  total,
  collapsed,
  hideCompleted,
  onToggleCollapsed,
  onHideCompleted,
  onDelete,
  onRenameTitle,
  disabled,
}: ChecklistHeaderProps) {
  const t = useTranslations('tasks');
  return (
    <div className="flex items-start gap-2">
      <ListChecks size={16} className="text-primary mt-0.5 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        <TaskChecklistInlineText
          value={title}
          onCommit={onRenameTitle}
          ariaLabel={t('sheet.checklist.titleAria')}
          disabled={disabled}
          className="text-sm font-medium"
        />
        {total > 0 ? (
          <p className="text-muted-foreground mt-0.5 text-xs">
            {t('sheet.checklist.progress', { done, total })}
          </p>
        ) : null}
      </div>
      {disabled ? null : (
        <ChecklistMenu
          hideCompleted={hideCompleted}
          onHideCompleted={onHideCompleted}
          onDelete={onDelete}
        />
      )}
      <button
        type="button"
        className={HEADER_ICON_BTN_CLASS}
        aria-expanded={!collapsed}
        aria-label={collapsed ? t('sheet.checklist.expandAria') : t('sheet.checklist.collapseAria')}
        title={collapsed ? t('sheet.checklist.expand') : t('sheet.checklist.collapse')}
        onClick={onToggleCollapsed}
      >
        <ChevronUp
          size={16}
          aria-hidden
          className={cn('transition-transform duration-200', collapsed && 'rotate-180')}
        />
      </button>
    </div>
  );
}

function ChecklistMenu({
  hideCompleted,
  onHideCompleted,
  onDelete,
}: {
  hideCompleted: boolean;
  onHideCompleted: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations('tasks');
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={(props) => (
          <Button
            {...props}
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={t('sheet.checklist.actionsAria')}
            title={t('sheet.checklist.more')}
            className={cn(HEADER_ICON_BTN_CLASS, props.className)}
          >
            <MoreHorizontal size={16} aria-hidden />
          </Button>
        )}
      />
      <DropdownMenuContent align="end" className="min-w-[13rem]">
        <DropdownMenuItem className="justify-between" onClick={onHideCompleted}>
          {hideCompleted ? t('sheet.checklist.showCompleted') : t('sheet.checklist.hideCompleted')}
          {hideCompleted ? <Eye size={14} aria-hidden /> : <EyeOff size={14} aria-hidden />}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" className="justify-between" onClick={onDelete}>
          {t('sheet.checklist.delete')}
          <Trash2 size={14} aria-hidden />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ChecklistItem({
  item,
  disabled,
  onToggleItem,
  onDeleteItem,
  onRenameItem,
}: {
  item: TaskChecklistItem;
  disabled: boolean;
  onToggleItem: (itemId: string) => void;
  onDeleteItem: (itemId: string) => void;
  onRenameItem: (itemId: string, text: string) => Promise<void>;
}) {
  const t = useTranslations('tasks');
  return (
    <div className="group hover:bg-muted/60 flex items-center gap-2 rounded-md px-0.5 py-1">
      <Checkbox
        checked={item.checked}
        disabled={disabled}
        onCheckedChange={() => onToggleItem(item.id)}
      />
      <TaskChecklistInlineText
        value={item.text}
        onCommit={(text) => onRenameItem(item.id, text)}
        ariaLabel={t('sheet.checklist.itemAria')}
        disabled={disabled}
        strike={item.checked}
        className="min-w-0 flex-1 text-sm"
      />
      {disabled ? null : (
        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
          title={t('sheet.checklist.deleteItem')}
          onClick={() => onDeleteItem(item.id)}
        >
          <Trash2 size={12} />
        </Button>
      )}
    </div>
  );
}
