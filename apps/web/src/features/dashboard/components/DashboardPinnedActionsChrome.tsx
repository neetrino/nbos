'use client';

import { type FormEvent, useState, type ReactNode } from 'react';
import { Check, Save, SlidersHorizontal } from 'lucide-react';
import { ActionTileButton } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useDroppable } from '@dnd-kit/core';

export function PinnedDropColumn({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'border-border/80 bg-muted/10 rounded-lg border border-dashed p-3',
        isOver && 'border-primary/50 bg-muted/25',
      )}
    >
      <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
        {title}
      </h3>
      {children}
    </div>
  );
}

export function CreateLinkInline({
  onCreate,
  saving,
}: {
  onCreate: (label: string, url: string) => Promise<void>;
  saving: boolean;
}) {
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const canSubmit = Boolean(label.trim() && url.trim());

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    await onCreate(label.trim(), url.trim());
    setLabel('');
    setUrl('');
  }

  return (
    <div className="border-border/80 bg-muted/20 mt-5 rounded-xl border border-dashed p-4">
      <h3 className="text-sm font-semibold">New shortcut button</h3>
      <p className="text-muted-foreground mt-1 text-xs">
        Label and link are saved to your dashboard pinned area.
      </p>
      <form
        className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={(e) => void submit(e)}
      >
        <div className="grid flex-1 gap-2 sm:grid-cols-2">
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label" />
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="/path or example.com (https added)"
          />
        </div>
        <ActionTileButton
          label={saving ? 'Saving…' : 'Save'}
          icon={<Save aria-hidden />}
          tone="emerald"
          size="sm"
          buttonType="submit"
          disabled={!canSubmit || saving}
          className="shrink-0"
        />
      </form>
    </div>
  );
}

export function PinnedActionsTitle({
  editMode,
  onToggleEdit,
}: {
  editMode: boolean;
  onToggleEdit: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <div>
          <p className="nbos-desk-kicker">Shortcuts</p>
          <h2 className="mt-1 text-base font-semibold">Pinned actions</h2>
        </div>
        {editMode ? <Badge variant="outline">Editing</Badge> : null}
      </div>
      <Button
        type="button"
        variant={editMode ? 'default' : 'secondary'}
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={onToggleEdit}
        aria-label={editMode ? 'Done editing layout' : 'Edit layout'}
      >
        {editMode ? (
          <Check className="h-4 w-4" aria-hidden />
        ) : (
          <SlidersHorizontal className="h-4 w-4" aria-hidden />
        )}
      </Button>
    </div>
  );
}

export function EmptyPinnedActions() {
  return (
    <p className="text-muted-foreground mt-4 rounded-xl border border-dashed p-4 text-sm">
      No pinned actions are available for your current permissions.
    </p>
  );
}
