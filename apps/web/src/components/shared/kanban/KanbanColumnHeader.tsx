'use client';

import { useState } from 'react';
import { Pencil, Trash2, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { KanbanColorPicker } from './KanbanColorPicker';
import { contrastText, getColumnHex, type KanbanColumn } from './kanban.types';

interface ColumnHeaderProps<T> {
  column: KanbanColumn<T>;
  editable: boolean;
  onRenameColumn?: (key: string, title: string, color: string) => void;
  onDeleteColumn?: (key: string) => void;
}

export function KanbanColumnHeader<T>({
  column,
  editable,
  onRenameColumn,
  onDeleteColumn,
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
          onClick={() => setPickerOpen(!pickerOpen)}
          className="border-border h-8 w-8 shrink-0 rounded-lg border"
          style={{ backgroundColor: color }}
          title="Pick color"
        />
        {pickerOpen && (
          <KanbanColorPicker
            value={color}
            onChange={(c) => {
              setColor(c);
              setPickerOpen(false);
            }}
          />
        )}
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
        <button onClick={confirmRename} className="hover:bg-muted rounded p-0.5">
          <Check size={14} className="text-green-500" />
        </button>
        <button onClick={cancelRename} className="hover:bg-muted rounded p-0.5">
          <X size={14} className="text-muted-foreground" />
        </button>
      </div>
    );
  }

  if (hex) {
    const textColor = contrastText(hex);
    const iconAlpha = textColor === '#fff' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.4)';
    const iconHover = textColor === '#fff' ? 'hover:bg-white/20' : 'hover:bg-black/10';
    const countBg = textColor === '#fff' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.12)';

    return (
      <div
        className="flex w-full items-center gap-1.5 rounded-lg px-3 py-1.5"
        style={{ backgroundColor: hex }}
      >
        <span className="min-w-0 truncate text-sm font-bold" style={{ color: textColor }}>
          {column.label}
        </span>

        <span
          className="shrink-0 rounded px-1.5 py-0.5 text-xs font-medium tabular-nums"
          style={{ backgroundColor: countBg, color: textColor }}
        >
          {column.items.length}
        </span>

        {editable && !column.readonly && (
          <div className="ml-auto flex shrink-0 items-center gap-0.5">
            {onRenameColumn && (
              <button
                onClick={startRename}
                className={cn('rounded p-0.5', iconHover)}
                title="Rename"
              >
                <Pencil size={12} style={{ color: iconAlpha }} />
              </button>
            )}
            {onDeleteColumn && (
              <button
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
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex w-full items-center gap-2">
      <div className={cn('h-2.5 w-2.5 shrink-0 rounded-full', column.color)} />
      <h3 className="text-foreground min-w-0 truncate text-sm font-bold">{column.label}</h3>

      <span className="bg-secondary text-muted-foreground ml-auto shrink-0 rounded-md px-2 py-0.5 text-xs font-medium tabular-nums">
        {column.items.length}
      </span>

      {editable && !column.readonly && (
        <div className="flex shrink-0 items-center gap-0.5">
          {onRenameColumn && (
            <button onClick={startRename} className="hover:bg-muted rounded p-0.5" title="Rename">
              <Pencil size={12} className="text-muted-foreground" />
            </button>
          )}
          {onDeleteColumn && (
            <button
              onClick={() => !hasItems && onDeleteColumn(column.key)}
              className={cn(
                'rounded p-0.5',
                hasItems ? 'cursor-not-allowed opacity-30' : 'hover:bg-destructive/10',
              )}
              title={hasItems ? 'Move all tasks first' : 'Delete'}
              disabled={hasItems}
            >
              <Trash2 size={12} className="text-muted-foreground" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
