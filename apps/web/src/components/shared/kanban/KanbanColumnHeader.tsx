'use client';

import { useState, type ReactNode } from 'react';
import { Pencil, Trash2, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { KanbanColorPicker } from './KanbanColorPicker';
import { contrastText, getColumnHex, type KanbanColumn } from './kanban.types';

interface ColumnHeaderProps<T> {
  column: KanbanColumn<T>;
  editable: boolean;
  onRenameColumn?: (key: string, title: string, color: string) => void;
  onDeleteColumn?: (key: string) => void;
  trailing?: ReactNode;
}

function KanbanStageHeaderBar({
  hex,
  label,
  count,
  textColor,
  trailing,
  editable,
  column,
  hasItems,
  onRenameColumn,
  onDeleteColumn,
  onStartRename,
}: {
  hex: string;
  label: string;
  count: number;
  textColor: '#fff' | '#000';
  trailing?: ReactNode;
  editable: boolean;
  column: KanbanColumn<unknown>;
  hasItems: boolean;
  onRenameColumn?: (key: string, title: string, color: string) => void;
  onDeleteColumn?: (key: string) => void;
  onStartRename: () => void;
}) {
  const iconAlpha = textColor === '#fff' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.4)';
  const iconHover = textColor === '#fff' ? 'hover:bg-white/20' : 'hover:bg-black/10';

  return (
    <div
      className="group/bar flex min-h-8 w-full items-center gap-1.5 rounded-md px-3 py-1.5"
      style={{ backgroundColor: hex }}
    >
      <span className="min-w-0 truncate text-sm font-bold" style={{ color: textColor }}>
        {label}
      </span>

      <span
        className="ml-auto shrink-0 text-xs font-medium tabular-nums"
        style={{ color: textColor }}
      >
        {count}
      </span>

      {trailing ? (
        <div className="ml-auto flex shrink-0 items-center justify-center self-stretch">
          {trailing}
        </div>
      ) : null}

      {editable && !column.readonly ? (
        <div
          className={cn(
            'flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/bar:opacity-100',
            !trailing && 'ml-auto',
          )}
        >
          {onRenameColumn ? (
            <button
              type="button"
              onClick={onStartRename}
              className={cn('rounded p-0.5', iconHover)}
              title="Rename"
            >
              <Pencil size={12} style={{ color: iconAlpha }} />
            </button>
          ) : null}
          {onDeleteColumn ? (
            <button
              type="button"
              onClick={() => !hasItems && onDeleteColumn(column.key)}
              className={cn(
                'rounded p-0.5',
                hasItems ? 'cursor-not-allowed opacity-30' : iconHover,
              )}
              title={hasItems ? 'Move all tasks first' : 'Delete'}
              disabled={hasItems}
            >
              <Trash2 size={12} style={{ color: iconAlpha }} />
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function KanbanColumnHeader<T>({
  column,
  editable,
  onRenameColumn,
  onDeleteColumn,
  trailing,
}: ColumnHeaderProps<T>) {
  const hex = getColumnHex(column);
  const hasItems = column.items.length > 0;

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [pickerOpen, setPickerOpen] = useState(false);

  const startRename = () => {
    setEditing(true);
    setTitle(column.label);
    setColor(hex ?? '#3B82F6');
    setPickerOpen(false);
  };

  const confirmRename = () => {
    if (title.trim() && onRenameColumn) {
      onRenameColumn(column.key, title.trim(), color);
    }
    setEditing(false);
    setPickerOpen(false);
  };

  const cancelRename = () => {
    setEditing(false);
    setPickerOpen(false);
  };

  if (editing) {
    return (
      <div className="relative flex w-full items-center gap-1">
        <button
          type="button"
          onClick={() => setPickerOpen(!pickerOpen)}
          className="border-border h-8 w-8 shrink-0 rounded-lg border"
          style={{ backgroundColor: color }}
          title="Pick color"
        />
        {pickerOpen ? (
          <KanbanColorPicker
            value={color}
            onChange={(c) => {
              setColor(c);
              setPickerOpen(false);
            }}
          />
        ) : null}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') confirmRename();
            if (e.key === 'Escape') cancelRename();
          }}
          className="h-8 flex-1 rounded-lg px-3 text-sm font-bold outline-none"
          style={{ backgroundColor: color, color: contrastText(color) }}
          autoFocus
        />
        <button type="button" onClick={confirmRename} className="hover:bg-muted rounded p-0.5">
          <Check size={14} className="text-green-500" />
        </button>
        <button type="button" onClick={cancelRename} className="hover:bg-muted rounded p-0.5">
          <X size={14} className="text-muted-foreground" />
        </button>
      </div>
    );
  }

  if (hex) {
    const textColor = contrastText(hex);

    return (
      <KanbanStageHeaderBar
        hex={hex}
        label={column.label}
        count={column.items.length}
        textColor={textColor}
        trailing={trailing}
        editable={editable}
        column={column as KanbanColumn<unknown>}
        hasItems={hasItems}
        onRenameColumn={onRenameColumn}
        onDeleteColumn={onDeleteColumn}
        onStartRename={startRename}
      />
    );
  }

  return (
    <KanbanStageHeaderBar
      hex="#6B7280"
      label={column.label}
      count={column.items.length}
      textColor="#fff"
      trailing={trailing}
      editable={editable}
      column={column as KanbanColumn<unknown>}
      hasItems={hasItems}
      onRenameColumn={onRenameColumn}
      onDeleteColumn={onDeleteColumn}
      onStartRename={startRename}
    />
  );
}
