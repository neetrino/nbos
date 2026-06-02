'use client';

import { useEffect, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { DetailSheetSettingsMenu, StatusBadge } from '@/components/shared';
import {
  getAccessLevel,
  getCredentialCriticality,
} from '@/features/credentials/constants/credentials';
import { cn } from '@/lib/utils';

export interface CredentialFormSheetHeaderProps {
  isCreate: boolean;
  credentialId: string | null;
  name: string;
  onNameChange: (value: string) => void;
  accessLevel: string;
  categoryLabel: string;
  criticality: string;
  showSettings: boolean;
  onToggleSettings: () => void;
  onRequestArchive?: (id: string, name: string) => void;
  resetKey: string;
}

export function CredentialFormSheetHeader({
  isCreate,
  credentialId,
  name,
  onNameChange,
  accessLevel,
  categoryLabel,
  criticality,
  showSettings,
  onToggleSettings,
  onRequestArchive,
  resetKey,
}: CredentialFormSheetHeaderProps) {
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(name);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditingName(false);
    setNameDraft(name);
  }, [resetKey, name]);

  useEffect(() => {
    if (editingName) {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }
  }, [editingName]);

  const accessMeta = getAccessLevel(accessLevel);
  const critMeta = getCredentialCriticality(criticality);

  const commitName = () => {
    const trimmed = nameDraft.trim();
    onNameChange(trimmed);
    setEditingName(false);
  };

  return (
    <div className="border-border flex shrink-0 items-start justify-between gap-3 border-b px-6 py-4">
      <div className="min-w-0 flex-1 space-y-2">
        {editingName ? (
          <Input
            ref={nameInputRef}
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitName();
              if (e.key === 'Escape') {
                setNameDraft(name);
                setEditingName(false);
              }
            }}
            className="border-0 bg-transparent p-0 text-lg font-semibold shadow-none focus-visible:ring-0"
            placeholder="Credential name"
            aria-label="Name"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            data-1p-ignore
            data-lpignore="true"
          />
        ) : (
          <button
            type="button"
            className={cn(
              'text-left text-lg font-semibold outline-none',
              name.trim() ? 'text-foreground' : 'text-muted-foreground',
            )}
            onClick={() => {
              setNameDraft(name);
              setEditingName(true);
            }}
          >
            {name.trim() || 'Credential name'}
          </button>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {accessMeta ? (
            <StatusBadge label={accessMeta.label} variant={accessMeta.variant} />
          ) : null}
          {critMeta && !isCreate ? (
            <StatusBadge label={critMeta.label} variant={critMeta.variant} />
          ) : null}
          <span className="text-muted-foreground text-xs">{categoryLabel}</span>
        </div>
      </div>
      {!isCreate && credentialId && onRequestArchive ? (
        <DetailSheetSettingsMenu>
          <DropdownMenuItem onClick={onToggleSettings}>
            {showSettings ? 'Hide advanced settings' : 'Advanced settings'}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => onRequestArchive(credentialId, name)}
          >
            <Trash2 className="mr-2 size-4" />
            Archive
          </DropdownMenuItem>
        </DetailSheetSettingsMenu>
      ) : null}
    </div>
  );
}
