'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Check, ExternalLink, LoaderCircle, Puzzle } from 'lucide-react';
import { DetailSheetSettingsMenu } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface DeliveryItemDetailHeaderProps {
  title: string;
  entityKind: 'PRODUCT' | 'EXTENSION';
  workspaceHref: string;
  loading: boolean;
  onCommitTitle: (trimmed: string) => Promise<void>;
}

export function DeliveryItemDetailHeader({
  title,
  entityKind,
  workspaceHref,
  loading,
  onCommitTitle,
}: DeliveryItemDetailHeaderProps) {
  const router = useRouter();
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [savingName, setSavingName] = useState(false);
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

  const saveName = useCallback(async () => {
    if (savingName) return;
    const trimmed = nameValue.trim();
    if (!trimmed) {
      setNameValue(title);
      setEditingName(false);
      return;
    }
    if (trimmed === title) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    try {
      await onCommitTitle(trimmed);
      setEditingName(false);
    } finally {
      setSavingName(false);
    }
  }, [nameValue, onCommitTitle, savingName, title]);

  const cancelEditing = useCallback(() => {
    if (savingName) return;
    setNameValue(title);
    setEditingName(false);
  }, [savingName, title]);

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void saveName();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditing();
    }
  };

  return (
    <div className="bg-background border-border shrink-0 border-b px-7 pt-5 pb-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mt-1 inline-flex max-w-full min-w-0 items-center gap-2">
            <EntityIcon className={cn('size-5 shrink-0', entityColorClass)} aria-hidden />
            {editingName ? (
              <div className="inline-flex max-w-full min-w-0 items-center gap-1">
                <input
                  ref={nameInputRef}
                  size={Math.max(nameValue.length, 8)}
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onBlur={() => void saveName()}
                  onKeyDown={handleNameKeyDown}
                  placeholder="Name…"
                  disabled={savingName}
                  className="border-primary text-foreground placeholder:text-muted-foreground/70 max-w-[28rem] min-w-0 flex-none border-0 border-b-2 bg-transparent text-xl font-bold tracking-tight outline-none disabled:cursor-wait disabled:opacity-70"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="mt-0.5 shrink-0"
                  disabled={savingName}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => void saveName()}
                  aria-label="Save name"
                  title="Save name"
                >
                  {savingName ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Check className="size-4" />
                  )}
                </Button>
              </div>
            ) : (
              <h2
                onClick={startEditing}
                className={cn(
                  'text-foreground -mx-1 max-w-[28rem] min-w-0 cursor-text truncate rounded px-1 text-xl font-bold tracking-tight transition-colors',
                  loading ? 'cursor-default' : 'hover:bg-stone-100 dark:hover:bg-stone-800',
                )}
                title={loading ? undefined : 'Click to edit name'}
              >
                {loading && !title.trim() ? '…' : title}
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
