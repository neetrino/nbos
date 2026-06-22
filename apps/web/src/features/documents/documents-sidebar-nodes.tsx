'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ChevronRight, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import type { DocumentListItem } from '@/lib/api/documents';

export const NATIVE_TYPE = 'NATIVE' as const;
export const DOCS_PER_LOCATION = 30;

/** Milliseconds within which two touch-end events count as a double-tap. */
const DOUBLE_TAP_THRESHOLD_MS = 350;

/**
 * Returns touch-event handlers for detecting a double-tap on an element.
 * Compatible with React's synthetic events.
 */
export function useTouchDoubleTap(onDoubleTap: () => void) {
  const lastTapRef = useRef<number>(0);
  return {
    onTouchEnd: (e: React.TouchEvent) => {
      const now = Date.now();
      if (now - lastTapRef.current < DOUBLE_TAP_THRESHOLD_MS) {
        lastTapRef.current = 0;
        e.preventDefault();
        onDoubleTap();
        return;
      }
      lastTapRef.current = now;
    },
  };
}

export interface DocItemProps {
  doc: DocumentListItem;
  activeDocId: string | undefined;
}

export function DocItem({ doc, activeDocId }: DocItemProps) {
  return (
    <li>
      <Link
        href={`/documents/${doc.id}`}
        className={cn(
          'flex min-w-0 items-center gap-1.5 rounded px-2 py-0.5 text-xs transition-colors',
          activeDocId === doc.id
            ? 'bg-accent text-accent-foreground font-medium'
            : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
        )}
      >
        <FileText size={11} aria-hidden className="shrink-0 opacity-70" />
        <span className="truncate">{doc.title}</span>
      </Link>
    </li>
  );
}

export interface DocListProps {
  docs: DocumentListItem[];
  docsLoaded: boolean;
  activeDocId: string | undefined;
}

export function DocList({ docs, docsLoaded, activeDocId }: DocListProps) {
  if (!docsLoaded) {
    return (
      <div className="mt-0.5 space-y-0.5">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full rounded" />
        ))}
      </div>
    );
  }
  if (docs.length === 0) {
    return <p className="text-muted-foreground px-2 py-0.5 text-xs">No documents</p>;
  }
  return (
    <ul className="space-y-0.5">
      {docs.map((doc) => (
        <DocItem key={doc.id} doc={doc} activeDocId={activeDocId} />
      ))}
    </ul>
  );
}

export interface RenameState {
  folderId: string;
  value: string;
  saving: boolean;
}

export interface CollapsibleRowProps {
  label: string;
  icon?: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  active?: boolean;
  indent?: boolean;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  /** Fires when the label area is double-clicked (desktop). */
  onLabelDoubleClick?: () => void;
  /** When set, renders a rename input instead of the label text. */
  renameState?: RenameState | null;
  onRenameChange?: (value: string) => void;
  onRenameSubmit?: () => void;
  onRenameCancel?: () => void;
}

export function CollapsibleRow({
  label,
  icon,
  open,
  onToggle,
  active = false,
  indent = false,
  actions,
  children,
  onLabelDoubleClick,
  renameState,
  onRenameChange,
  onRenameSubmit,
  onRenameCancel,
}: CollapsibleRowProps) {
  const isRenaming = renameState != null;

  return (
    <Collapsible open={open}>
      <div className={cn('group flex items-center', indent && 'ml-4')}>
        <CollapsibleTrigger
          aria-label={open ? `Collapse ${label}` : `Expand ${label}`}
          onClick={onToggle}
          className="text-muted-foreground hover:text-foreground flex size-5 shrink-0 items-center justify-center rounded transition-colors"
        >
          <ChevronRight size={12} className={cn('transition-transform', open && 'rotate-90')} />
        </CollapsibleTrigger>

        {isRenaming ? (
          <div className="flex flex-1 items-center gap-1 pr-1">
            {icon}
            <Input
              autoFocus
              value={renameState.value}
              disabled={renameState.saving}
              className="h-5 min-w-0 flex-1 px-1 py-0 text-xs"
              onChange={(e) => onRenameChange?.(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onRenameSubmit?.();
                }
                if (e.key === 'Escape') {
                  e.preventDefault();
                  onRenameCancel?.();
                }
              }}
              onBlur={() => onRenameCancel?.()}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={onToggle}
            onDoubleClick={onLabelDoubleClick}
            className={cn(
              'flex flex-1 items-center gap-1.5 rounded px-1.5 py-1 text-sm transition-colors',
              active
                ? 'bg-accent text-accent-foreground font-medium'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
            )}
          >
            {icon}
            <span className="truncate">{label}</span>
          </button>
        )}

        {!isRenaming && actions ? (
          <div className="mr-1 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            {actions}
          </div>
        ) : null}
      </div>

      <CollapsibleContent>
        <div className="mt-0.5 ml-5">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}
