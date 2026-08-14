'use client';

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Check, LoaderCircle, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { resolveInlineTitleCommit } from '@/features/projects/utils/resolve-inline-title-commit';
import { cn } from '@/lib/utils';

export interface InlineEditableEntityTitleProps {
  value: string;
  onCommit: (trimmed: string) => Promise<void>;
  /** Title / aria hint when not editing. */
  editHint?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Applied to the display title and the edit input. */
  titleClassName?: string;
}

/**
 * Click / pencil → inline rename. Enter saves, Escape cancels, blur saves.
 * Empty commit restores the previous value.
 */
export function InlineEditableEntityTitle({
  value,
  onCommit,
  editHint = 'Click to edit name',
  placeholder = 'Name…',
  disabled = false,
  className,
  titleClassName,
}: InlineEditableEntityTitleProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [editing, value]);

  useEffect(() => {
    if (!editing || !inputRef.current) return;
    inputRef.current.focus();
    inputRef.current.select();
  }, [editing]);

  const startEditing = () => {
    if (disabled || saving) return;
    setDraft(value);
    setEditing(true);
  };

  const cancelEditing = useCallback(() => {
    if (saving) return;
    setDraft(value);
    setEditing(false);
  }, [saving, value]);

  const save = useCallback(async () => {
    if (saving) return;
    const decision = resolveInlineTitleCommit(draft, value);
    if (decision.action === 'cancel') {
      setDraft(value);
      setEditing(false);
      return;
    }
    if (decision.action === 'noop') {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onCommit(decision.value);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }, [draft, onCommit, saving, value]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void save();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditing();
    }
  };

  if (editing) {
    return (
      <div className={cn('inline-flex max-w-full min-w-0 items-center gap-1', className)}>
        <input
          ref={inputRef}
          size={Math.max(draft.length, 8)}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => void save()}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={saving}
          aria-label="Edit name"
          className={cn(
            'border-primary text-foreground placeholder:text-muted-foreground/70 max-w-[28rem] min-w-0 flex-none border-0 border-b-2 bg-transparent outline-none disabled:cursor-wait disabled:opacity-70',
            titleClassName,
          )}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0"
          disabled={saving}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => void save()}
          aria-label="Save name"
          title="Save name"
        >
          {saving ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('group/title inline-flex max-w-full min-w-0 items-center gap-1', className)}>
      <button
        type="button"
        onClick={startEditing}
        disabled={disabled}
        title={disabled ? undefined : editHint}
        className={cn(
          'text-foreground -mx-1 max-w-[28rem] min-w-0 truncate rounded px-1 text-left transition-colors',
          disabled ? 'cursor-default' : 'cursor-text hover:bg-stone-100 dark:hover:bg-stone-800',
          titleClassName,
        )}
      >
        {value.trim() ? value : '…'}
      </button>
      {!disabled ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground/70 size-7 shrink-0 opacity-0 transition-opacity group-focus-within/title:opacity-100 group-hover/title:opacity-100"
          onClick={startEditing}
          aria-label={editHint}
          title={editHint}
        >
          <Pencil className="size-3.5" aria-hidden />
        </Button>
      ) : null}
    </div>
  );
}
