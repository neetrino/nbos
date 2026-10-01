'use client';

import type { ReactNode } from 'react';
import { ClipboardCopy, CornerUpLeft, Forward, ListTodo, Trash2, X } from 'lucide-react';

export function InternalMessageSelectionBar({
  selectedCount,
  canCreateTask,
  onReply,
  onForward,
  onCreateTask,
  onCopySource,
  onDelete,
  onDone,
}: {
  selectedCount: number;
  canCreateTask: boolean;
  onReply?: () => void;
  onForward: () => void;
  onCreateTask: () => void;
  onCopySource: () => void;
  onDelete?: () => void;
  onDone: () => void;
}) {
  return (
    <div className="border-border bg-card flex h-12 items-center gap-1 border-b px-2">
      <button
        type="button"
        aria-label="Done"
        onClick={onDone}
        className="text-muted-foreground hover:bg-muted flex size-9 items-center justify-center rounded-full"
      >
        <X size={20} />
      </button>
      <p className="text-foreground min-w-0 flex-1 truncate text-sm font-semibold">
        {selectedCount}
      </p>
      {onReply ? (
        <IconAction label="Reply" onClick={onReply}>
          <CornerUpLeft size={20} />
        </IconAction>
      ) : null}
      <IconAction label="Forward" onClick={onForward}>
        <Forward size={20} />
      </IconAction>
      {canCreateTask ? (
        <IconAction label="Create Task" onClick={onCreateTask}>
          <ListTodo size={20} />
        </IconAction>
      ) : null}
      <IconAction label="Copy source" onClick={onCopySource}>
        <ClipboardCopy size={20} />
      </IconAction>
      {onDelete ? (
        <IconAction label="Delete" tone="danger" onClick={onDelete}>
          <Trash2 size={20} />
        </IconAction>
      ) : null}
    </div>
  );
}

function IconAction({
  label,
  onClick,
  children,
  tone = 'default',
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  tone?: 'default' | 'danger';
}) {
  const danger = tone === 'danger';
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={
        danger
          ? 'flex size-9 items-center justify-center rounded-full text-[#dc2626] hover:bg-[#fef2f2]'
          : 'flex size-9 items-center justify-center rounded-full text-[#334155] hover:bg-[#eef2ff] hover:text-[#4f46e5]'
      }
    >
      {children}
    </button>
  );
}
