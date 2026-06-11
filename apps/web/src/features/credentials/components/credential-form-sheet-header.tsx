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
import {
  credentialAccessIcon,
  credentialCriticalityIcon,
} from '@/features/credentials/utils/credential-vault-card-meta';
import { cn } from '@/lib/utils';
import { CredentialFormCategoryMenu } from './credential-form-category-menu';
import type { CredentialCategoryOption } from '@/features/credentials/constants/credential-vault-categories';

const SHEET_TITLE_CLASS = 'text-xl font-semibold leading-tight tracking-tight';
const SHEET_TITLE_FIELD_CLASS = cn(SHEET_TITLE_CLASS, 'min-h-7 max-w-full truncate');
const SHEET_TITLE_INPUT_CLASS = cn(
  SHEET_TITLE_CLASS,
  'h-7 min-w-[12ch] max-w-full flex-1 rounded-none border-0 bg-transparent p-0 shadow-none',
  'text-xl md:text-xl',
  'focus-visible:border-0 focus-visible:ring-0',
);
const TITLE_CLUSTER_MAX_CLASS = 'max-w-[calc(100%-5.5rem)]';
const ACCESS_SCOPE_BADGE_CLASS = 'h-5 shrink-0 px-1.5 py-0 text-[10px] leading-none';

export interface CredentialFormSheetHeaderProps {
  isCreate: boolean;
  credentialId: string | null;
  name: string;
  onNameChange: (value: string) => void;
  accessLevel: string;
  category: string;
  categoryLabel: string;
  categoryOptions: readonly CredentialCategoryOption[];
  categoryLocked: boolean;
  onCategoryChange: (value: string) => void;
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
  category,
  categoryLabel,
  categoryOptions,
  categoryLocked,
  onCategoryChange,
  criticality,
  showSettings,
  onToggleSettings,
  onRequestArchive,
  resetKey,
}: CredentialFormSheetHeaderProps) {
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(name);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [trackedResetKey, setTrackedResetKey] = useState(resetKey);

  if (trackedResetKey !== resetKey) {
    setTrackedResetKey(resetKey);
    setEditingName(false);
    setNameDraft(name);
  }

  useEffect(() => {
    if (editingName) {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }
  }, [editingName]);

  const accessMeta = getAccessLevel(accessLevel);
  const critMeta = getCredentialCriticality(criticality);
  const AccessIcon = credentialAccessIcon(accessLevel);
  const CritIcon = credentialCriticalityIcon(criticality);

  const commitName = () => {
    const trimmed = nameDraft.trim();
    onNameChange(trimmed);
    setEditingName(false);
  };

  return (
    <div className="border-border flex shrink-0 items-start justify-between gap-4 border-b px-6 py-5">
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            className={cn(
              'inline-flex min-w-0 items-center gap-1.5',
              TITLE_CLUSTER_MAX_CLASS,
              editingName && 'min-w-0 flex-1',
            )}
          >
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
                className={SHEET_TITLE_INPUT_CLASS}
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
                  SHEET_TITLE_FIELD_CLASS,
                  'text-left outline-none',
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

            {accessMeta ? (
              <StatusBadge
                label={accessMeta.label}
                variant={accessMeta.variant}
                className={ACCESS_SCOPE_BADGE_CLASS}
                icon={<AccessIcon className="size-2.5 shrink-0 opacity-90" aria-hidden />}
              />
            ) : null}

            {critMeta && !isCreate ? (
              <StatusBadge
                label={critMeta.label}
                variant={critMeta.variant}
                className={ACCESS_SCOPE_BADGE_CLASS}
                icon={<CritIcon className="size-2.5 shrink-0 opacity-90" aria-hidden />}
              />
            ) : null}
          </div>

          <div className="ml-auto shrink-0">
            <CredentialFormCategoryMenu
              category={category}
              categoryLabel={categoryLabel}
              categoryOptions={categoryOptions}
              categoryLocked={categoryLocked}
              onCategoryChange={onCategoryChange}
            />
          </div>
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
