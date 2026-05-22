'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { KanbanColumn, KanbanColumnQuickCreateConfig } from './kanban.types';

interface KanbanColumnQuickCreateProps<T> {
  column: KanbanColumn<T>;
  config: KanbanColumnQuickCreateConfig<T>;
}

export function KanbanColumnQuickCreate<T>({ column, config }: KanbanColumnQuickCreateProps<T>) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const enabled = config.isEnabled(column);
  const isDialogMode = Boolean(config.onOpenDialog);

  const close = useCallback(() => {
    setOpen(false);
    setTitle('');
  }, []);

  useEffect(() => {
    if (!open || isDialogMode) return;
    const id = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(id);
  }, [open, isDialogMode]);

  if (!enabled) return null;

  const handleTrigger = () => {
    if (isDialogMode) {
      config.onOpenDialog?.(column.key);
      return;
    }
    setOpen(true);
  };

  const handleSubmit = async () => {
    const trimmed = title.trim();
    if (!trimmed || loading || !config.onCreate) return;
    setLoading(true);
    try {
      await config.onCreate({ title: trimmed, columnKey: column.key });
      close();
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    const labelText = config.buttonLabel.replace(/^\+\s*/, '');

    return (
      <button
        type="button"
        onClick={handleTrigger}
        className={cn(
          'mx-auto flex w-[94%] max-w-full items-center justify-center gap-1 rounded-full border',
          'border-primary/20 bg-primary/[0.08] text-foreground/90 shadow-none backdrop-blur-sm',
          'px-2.5 py-1 text-xs font-medium transition-colors',
          'hover:border-primary/30 hover:bg-primary/[0.14] hover:text-foreground',
          'dark:border-white/15 dark:bg-white/10 dark:text-white/90',
          'dark:hover:border-white/25 dark:hover:bg-white/15',
          'focus-visible:ring-primary/25 focus-visible:ring-2 focus-visible:outline-none',
        )}
      >
        <Plus size={13} strokeWidth={2} aria-hidden />
        {labelText}
      </button>
    );
  }

  if (isDialogMode) return null;

  const canSubmit = title.trim().length > 0 && !loading;

  return (
    <div className="bg-card border-border space-y-2.5 rounded-xl border p-3 shadow-sm">
      <Input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && canSubmit) {
            e.preventDefault();
            void handleSubmit();
          }
          if (e.key === 'Escape') close();
        }}
        placeholder={config.titlePlaceholder ?? 'Title'}
        disabled={loading}
        aria-label={config.titleAriaLabel ?? 'Title'}
      />
      <div className="flex items-center gap-2">
        <Button type="button" size="sm" disabled={!canSubmit} onClick={() => void handleSubmit()}>
          {loading ? 'Creating…' : (config.createLabel ?? 'Create')}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="text-muted-foreground"
          disabled={loading}
          onClick={close}
        >
          {config.cancelLabel ?? 'Cancel'}
        </Button>
      </div>
    </div>
  );
}
