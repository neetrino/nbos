'use client';

import { useState } from 'react';
import { BookmarkPlus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { CredentialVaultSavedView } from '@/features/credentials/constants/credential-vault-saved-view.types';

export interface CredentialVaultSavedViewsBarProps {
  views: CredentialVaultSavedView[];
  onApply: (viewId: string) => void;
  onSave: (name: string) => void;
  onRemove: (viewId: string) => void;
}

export function CredentialVaultSavedViewsBar({
  views,
  onApply,
  onSave,
  onRemove,
}: CredentialVaultSavedViewsBarProps) {
  const [draftName, setDraftName] = useState('');
  const [selectedId, setSelectedId] = useState('');

  const handleApply = (viewId: string) => {
    if (!viewId) return;
    onApply(viewId);
    setSelectedId('');
  };

  return (
    <div className="border-border/70 bg-muted/30 flex flex-col gap-2 rounded-xl border px-3 py-2 sm:flex-row sm:items-center">
      <label className="text-muted-foreground shrink-0 text-xs font-medium">Saved views</label>
      <select
        aria-label="Apply saved view"
        className="border-input bg-background h-9 min-w-0 flex-1 rounded-md border px-2 text-sm sm:max-w-xs"
        value={selectedId}
        onChange={(event) => {
          const id = event.target.value;
          setSelectedId(id);
          handleApply(id);
        }}
      >
        <option value="">Apply saved view…</option>
        {views.map((view) => (
          <option key={view.id} value={view.id}>
            {view.name}
          </option>
        ))}
      </select>
      <div className="relative min-w-0 flex-1 sm:max-w-[200px]">
        <BookmarkPlus
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
          aria-hidden
        />
        <Input
          value={draftName}
          onChange={(event) => setDraftName(event.target.value)}
          placeholder="Save current filters…"
          className="bg-background h-9 pl-9"
          onKeyDown={(event) => {
            if (event.key !== 'Enter' || !draftName.trim()) return;
            onSave(draftName.trim());
            setDraftName('');
          }}
        />
      </div>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="shrink-0"
        disabled={!draftName.trim()}
        onClick={() => {
          onSave(draftName.trim());
          setDraftName('');
        }}
      >
        Save view
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-muted-foreground shrink-0 gap-1"
        disabled={!selectedId}
        onClick={() => {
          if (!selectedId) return;
          onRemove(selectedId);
          setSelectedId('');
        }}
        aria-label="Remove saved view selected in the list"
      >
        <Trash2 className="size-4" aria-hidden />
        Remove
      </Button>
    </div>
  );
}
