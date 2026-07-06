'use client';

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CrmSheetEntityHeaderProps {
  title: string;
  entityLabel: string;
  EntityIcon: LucideIcon;
  headerIconClassName: string;
  headerBadgeClassName: string;
  editing: boolean;
  nameValue: string;
  onNameValueChange: (value: string) => void;
  onCommitName: () => void;
  onNameKeyDown: (e: React.KeyboardEvent) => void;
  nameInputRef: React.RefObject<HTMLInputElement | null>;
  namePlaceholder: string;
  titleEditHint: string;
  onStartEditing: () => void;
  actions?: ReactNode;
  /** Applied to the editable title row (stage gate highlight). */
  titleClassName?: string;
}

export function CrmSheetEntityHeader({
  title,
  entityLabel,
  EntityIcon,
  headerIconClassName,
  headerBadgeClassName,
  editing,
  nameValue,
  onNameValueChange,
  onCommitName,
  onNameKeyDown,
  nameInputRef,
  namePlaceholder,
  titleEditHint,
  onStartEditing,
  actions,
  titleClassName,
}: CrmSheetEntityHeaderProps) {
  return (
    <div className="bg-background border-border shrink-0 border-b px-7 pt-5 pb-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              'inline-flex max-w-full min-w-0 flex-wrap items-center gap-2',
              titleClassName,
            )}
          >
            <EntityIcon className={cn('size-5 shrink-0', headerIconClassName)} aria-hidden />
            {editing ? (
              <input
                ref={nameInputRef}
                value={nameValue}
                onChange={(e) => onNameValueChange(e.target.value)}
                onBlur={onCommitName}
                onKeyDown={onNameKeyDown}
                placeholder={namePlaceholder}
                className="border-primary text-foreground placeholder:text-muted-foreground/70 max-w-full min-w-0 flex-1 border-0 border-b-2 bg-transparent text-xl font-bold tracking-tight outline-none"
              />
            ) : (
              <h2
                onClick={onStartEditing}
                className="text-foreground -mx-1 max-w-full min-w-0 cursor-text truncate rounded px-1 text-xl font-bold tracking-tight transition-colors hover:bg-stone-100 dark:hover:bg-stone-800"
                title={titleEditHint}
              >
                {title}
              </h2>
            )}
            <span
              className={cn(
                'shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase',
                headerBadgeClassName,
              )}
            >
              {entityLabel}
            </span>
          </div>
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-1.5">{actions}</div>
        ) : null}
      </div>
    </div>
  );
}
