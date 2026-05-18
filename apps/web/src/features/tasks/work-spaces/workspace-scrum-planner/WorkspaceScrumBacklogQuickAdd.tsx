'use client';

import { useCallback, useState, type KeyboardEvent } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { getApiErrorMessage } from '@/lib/api-errors';
import { tasksApi, type Task } from '@/lib/api/tasks';
import { cn } from '@/lib/utils';

export function WorkspaceScrumBacklogQuickAdd({
  workspaceId,
  creatorId,
  creatorReady,
  onCreated,
}: {
  workspaceId: string;
  creatorId: string | null;
  creatorReady: boolean;
  onCreated: (task: Task) => void;
}) {
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const disabled = (creatorReady && !creatorId) || saving;

  const submit = useCallback(async () => {
    const trimmed = title.trim();
    if (!trimmed || !creatorId) return;
    setSaving(true);
    try {
      const task = await tasksApi.create({
        title: trimmed,
        creatorId,
        workspaceId,
        planningStatus: 'BACKLOG',
        sprintId: null,
      });
      setTitle('');
      onCreated(task);
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, 'Could not create task.'));
    } finally {
      setSaving(false);
    }
  }, [title, creatorId, workspaceId, onCreated]);

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    void submit();
  };

  const placeholder =
    creatorReady && !creatorId ? 'Employee profile required' : 'Task name — press Enter to create';

  return (
    <div
      className={cn(
        'border-border/70 bg-muted/35 mb-2 shrink-0 rounded-lg border px-2 py-1.5',
        'transition-[border-color,box-shadow,background-color]',
        !disabled &&
          'focus-within:border-primary/80 focus-within:bg-background focus-within:ring-primary/30 focus-within:ring-2',
        disabled && 'pointer-events-none opacity-60',
      )}
    >
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={onKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          'text-foreground caret-primary h-7 border-0 bg-transparent pr-1 pl-2 text-sm shadow-none',
          'placeholder:text-muted-foreground/80',
          'focus-visible:border-transparent focus-visible:ring-0',
        )}
        aria-label="New backlog task title"
      />
    </div>
  );
}
