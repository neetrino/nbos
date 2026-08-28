'use client';

import { useEffect, useState, type KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import { resolveChecklistTextCommit } from './task-checklist-helpers';

const INPUT_CLASS =
  'placeholder:text-muted-foreground/55 w-full min-w-0 border-0 bg-transparent py-0 outline-none';

interface TaskChecklistInlineTextProps {
  value: string;
  onCommit: (next: string) => Promise<void>;
  ariaLabel: string;
  disabled?: boolean;
  strike?: boolean;
  className?: string;
}

export function TaskChecklistInlineText({
  value,
  onCommit,
  ariaLabel,
  disabled = false,
  strike = false,
  className,
}: TaskChecklistInlineTextProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  async function commit() {
    const decision = resolveChecklistTextCommit(draft, value);
    if (decision.action === 'cancel') {
      setDraft(value);
      return;
    }
    if (decision.action === 'noop') return;
    try {
      await onCommit(decision.value);
    } catch {
      setDraft(value);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.currentTarget.blur();
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      setDraft(value);
      event.currentTarget.blur();
    }
  }

  return (
    <input
      value={draft}
      disabled={disabled}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => void commit()}
      onKeyDown={handleKeyDown}
      aria-label={ariaLabel}
      className={cn(
        INPUT_CLASS,
        strike && 'text-muted-foreground line-through',
        disabled && 'cursor-default',
        className,
      )}
    />
  );
}
