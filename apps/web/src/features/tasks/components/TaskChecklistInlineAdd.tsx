'use client';

import { useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';

const ADD_TRIGGER_CLASS =
  'text-muted-foreground hover:text-foreground flex w-full items-center gap-1.5 rounded-md py-1.5 text-sm transition-colors';

const ADD_INPUT_CLASS =
  'placeholder:text-muted-foreground/55 h-8 w-full min-w-0 bg-transparent text-sm outline-none';

interface TaskChecklistInlineAddProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  autoStart?: boolean;
  stayOpenOnSubmit?: boolean;
}

export function TaskChecklistInlineAdd({
  label,
  placeholder,
  value,
  onChange,
  onSubmit,
  autoStart = false,
  stayOpenOnSubmit = false,
}: TaskChecklistInlineAddProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(autoStart);
  const [prevAutoStart, setPrevAutoStart] = useState(autoStart);
  const canSubmit = value.trim().length > 0;

  if (autoStart !== prevAutoStart) {
    setPrevAutoStart(autoStart);
    if (autoStart) setOpen(true);
  }

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function submit() {
    if (!canSubmit) return;
    onSubmit();
    if (!stayOpenOnSubmit) setOpen(false);
  }

  if (!open) {
    return (
      <button type="button" className={ADD_TRIGGER_CLASS} onClick={() => setOpen(true)}>
        <Plus size={14} aria-hidden />
        {label}
      </button>
    );
  }

  return (
    <input
      ref={inputRef}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          submit();
          return;
        }
        if (event.key === 'Escape') {
          event.preventDefault();
          onChange('');
          setOpen(false);
        }
      }}
      onBlur={() => {
        if (value.trim()) return;
        setOpen(false);
      }}
      placeholder={placeholder}
      aria-label={label}
      className={ADD_INPUT_CLASS}
    />
  );
}
