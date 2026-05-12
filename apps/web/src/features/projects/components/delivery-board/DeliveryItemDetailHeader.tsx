'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, ExternalLink, Puzzle } from 'lucide-react';
import { DetailSheetSettingsMenu } from '@/components/shared';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface DeliveryItemDetailHeaderProps {
  title: string;
  entityKind: 'PRODUCT' | 'EXTENSION';
  projectCode: string;
  workspaceHref: string;
  loading: boolean;
  onCommitTitle: (trimmed: string) => Promise<void>;
}

export function DeliveryItemDetailHeader({
  title,
  entityKind,
  projectCode,
  workspaceHref,
  loading,
  onCommitTitle,
}: DeliveryItemDetailHeaderProps) {
  const router = useRouter();
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);
  const entityLabel = entityKind === 'PRODUCT' ? 'Product' : 'Extension';
  const EntityIcon = entityKind === 'PRODUCT' ? Box : Puzzle;
  const entityColorClass =
    entityKind === 'PRODUCT'
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-orange-600 dark:text-orange-400';
  const entityBadgeClass =
    entityKind === 'PRODUCT'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-300'
      : 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/70 dark:bg-orange-950/30 dark:text-orange-300';

  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingName]);

  const startEditing = () => {
    if (loading) return;
    setNameValue(title);
    setEditingName(true);
  };

  const saveName = () => {
    const trimmed = nameValue.trim();
    setEditingName(false);
    if (trimmed && trimmed !== title) {
      void onCommitTitle(trimmed);
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveName();
    }
    if (e.key === 'Escape') {
      setEditingName(false);
    }
  };

  return (
    <div className="bg-background border-border shrink-0 border-b px-7 pt-5 pb-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mt-1 flex min-w-0 items-center gap-2">
            <EntityIcon className={cn('size-5 shrink-0', entityColorClass)} aria-hidden />
            {editingName ? (
              <input
                ref={nameInputRef}
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onBlur={saveName}
                onKeyDown={handleNameKeyDown}
                placeholder="Name…"
                className="border-primary text-foreground placeholder:text-muted-foreground/70 min-w-0 flex-1 border-0 border-b-2 bg-transparent text-xl font-bold tracking-tight outline-none"
              />
            ) : (
              <h2
                onClick={startEditing}
                className={cn(
                  'text-foreground -mx-1 min-w-0 flex-1 cursor-text truncate rounded px-1 text-xl font-bold tracking-tight transition-colors',
                  loading ? 'cursor-default' : 'hover:bg-stone-100 dark:hover:bg-stone-800',
                )}
                title={loading ? undefined : 'Click to edit name'}
              >
                {loading ? '…' : title}
              </h2>
            )}
            <span
              className={cn(
                'shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase',
                entityBadgeClass,
              )}
            >
              {entityLabel}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {workspaceHref && workspaceHref !== '#' ? (
            <DetailSheetSettingsMenu>
              <DropdownMenuItem onClick={() => router.push(workspaceHref)}>
                <ExternalLink />
                Open workspace
              </DropdownMenuItem>
            </DetailSheetSettingsMenu>
          ) : null}
        </div>
      </div>
    </div>
  );
}
