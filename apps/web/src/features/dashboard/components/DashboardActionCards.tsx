'use client';

import Link from 'next/link';
import type { HTMLAttributes } from 'react';
import { ExternalLink, Eye, GripVertical, Link2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DashboardPersonalLink, PinnedAction } from '../dashboard-control-registry';

/** Flat tile shared by visible pinned, hidden pinned, and personal link cards. */
export const PINNED_DASHBOARD_TILE_CLASS =
  'rounded-md border border-border bg-card transition-colors hover:bg-muted/50';

interface PinnedActionCardProps {
  action: PinnedAction;
  /** `hidden` = same tile as visible, eye icon, no navigation (edit layout). */
  variant?: 'visible' | 'hidden';
  editMode: boolean;
  dragHandleProps?: HTMLAttributes<HTMLButtonElement>;
}

interface PersonalLinkCardProps {
  editMode: boolean;
  link: DashboardPersonalLink;
  onDelete: () => Promise<void>;
}

export function PinnedActionCard({
  action,
  variant = 'visible',
  editMode,
  dragHandleProps,
}: PinnedActionCardProps) {
  const isHidden = variant === 'hidden';

  return (
    <div className={`${PINNED_DASHBOARD_TILE_CLASS} flex items-stretch gap-2 p-2.5`}>
      {editMode && dragHandleProps ? (
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground flex shrink-0 cursor-grab touch-none items-center rounded border border-transparent px-1 active:cursor-grabbing"
          aria-label={`Drag ${action.label}`}
          {...dragHandleProps}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      ) : null}
      {isHidden ? (
        <div className="flex min-w-0 flex-1 items-center gap-2.5 text-sm font-medium">
          <span className="bg-primary/15 text-primary flex shrink-0 rounded-md p-2" aria-hidden>
            <Eye size={18} />
          </span>
          <span className="truncate">{action.label}</span>
        </div>
      ) : (
        <Link
          href={action.href}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-sm font-medium"
        >
          <span className="bg-primary/15 text-primary flex shrink-0 rounded-md p-2">
            <action.icon size={18} />
          </span>
          <span className="truncate">{action.label}</span>
        </Link>
      )}
    </div>
  );
}

export function PersonalLinkCard({ editMode, link, onDelete }: PersonalLinkCardProps) {
  const labelRow = (
    <span className="flex min-w-0 flex-1 items-center gap-2.5 text-sm font-medium">
      <span className="bg-secondary text-secondary-foreground flex shrink-0 rounded-md p-2">
        <Link2 size={18} />
      </span>
      <span className="truncate">{link.label}</span>
      {link.isExternal ? (
        <ExternalLink className="text-muted-foreground h-3.5 w-3.5 shrink-0" aria-hidden />
      ) : null}
    </span>
  );

  const inner = link.isExternal ? (
    <a
      href={link.url}
      target={link.openInNewTab ? '_blank' : undefined}
      rel={link.openInNewTab ? 'noreferrer' : undefined}
      className="flex min-w-0 flex-1 items-center"
    >
      {labelRow}
    </a>
  ) : (
    <Link href={link.url} className="flex min-w-0 flex-1 items-center">
      {labelRow}
    </Link>
  );

  return (
    <div className={`${PINNED_DASHBOARD_TILE_CLASS} flex items-stretch gap-2 p-2.5`}>
      {inner}
      {editMode ? (
        <Button
          aria-label={`Delete ${link.label}`}
          variant="ghost"
          size="icon-xs"
          className="shrink-0"
          onClick={() => void onDelete()}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      ) : null}
    </div>
  );
}
