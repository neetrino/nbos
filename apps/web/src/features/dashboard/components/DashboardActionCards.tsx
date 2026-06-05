'use client';

import type { ReactNode } from 'react';
import { ExternalLink, Eye, Link2, Trash2 } from 'lucide-react';
import { ActionTileButton } from '@/components/shared';
import { Button } from '@/components/ui/button';
import {
  DASHBOARD_PINNED_TILE_MIN_HEIGHT_CLASS,
  getPinnedActionTone,
} from '../dashboard-pinned-action-tones';
import type { DashboardPersonalLink, PinnedAction } from '../dashboard-control-registry';
import { cn } from '@/lib/utils';

function DashboardPinnedTileShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex w-full', DASHBOARD_PINNED_TILE_MIN_HEIGHT_CLASS, className)}>
      {children}
    </div>
  );
}

interface PinnedActionCardProps {
  action: PinnedAction;
  variant?: 'visible' | 'hidden';
  editMode: boolean;
}

interface PersonalLinkCardProps {
  editMode: boolean;
  link: DashboardPersonalLink;
  onDelete: () => Promise<void>;
}

export function PinnedActionCard({ action, variant = 'visible', editMode }: PinnedActionCardProps) {
  const isHidden = variant === 'hidden';
  const Icon = isHidden ? Eye : action.icon;

  return (
    <DashboardPinnedTileShell>
      <ActionTileButton
        label={action.label}
        icon={<Icon aria-hidden />}
        tone={isHidden ? 'muted' : getPinnedActionTone(action.key)}
        size="lg"
        fullWidth
        className="h-full"
        href={!editMode && !isHidden ? action.href : undefined}
        displayOnly={editMode || isHidden}
      />
    </DashboardPinnedTileShell>
  );
}

export function PersonalLinkCard({ editMode, link, onDelete }: PersonalLinkCardProps) {
  return (
    <DashboardPinnedTileShell className="items-stretch gap-2">
      <ActionTileButton
        label={link.label}
        icon={<Link2 aria-hidden />}
        trailing={
          link.isExternal ? (
            <ExternalLink className="text-muted-foreground size-3.5 shrink-0" aria-hidden />
          ) : null
        }
        tone="secondary"
        size="lg"
        fullWidth
        className="h-full min-w-0 flex-1"
        href={link.url}
        external={link.isExternal}
        openInNewTab={link.openInNewTab}
        title={link.isExternal ? link.url : undefined}
      />
      {editMode ? (
        <Button
          aria-label={`Delete ${link.label}`}
          variant="ghost"
          size="icon-xs"
          className="shrink-0 self-center"
          onClick={() => void onDelete()}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      ) : null}
    </DashboardPinnedTileShell>
  );
}
