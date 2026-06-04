'use client';

import { ExternalLink, Eye, Link2, Trash2 } from 'lucide-react';
import { ActionTileButton } from '@/components/shared';
import { Button } from '@/components/ui/button';
import type { DashboardPersonalLink, PinnedAction } from '../dashboard-control-registry';

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
    <div className="flex items-stretch gap-2">
      <ActionTileButton
        label={action.label}
        icon={<Icon aria-hidden />}
        tone={isHidden ? 'muted' : 'primary'}
        size="lg"
        fullWidth
        href={!editMode && !isHidden ? action.href : undefined}
        displayOnly={editMode || isHidden}
      />
    </div>
  );
}

export function PersonalLinkCard({ editMode, link, onDelete }: PersonalLinkCardProps) {
  return (
    <div className="flex items-stretch gap-2">
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
          className="shrink-0"
          onClick={() => void onDelete()}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      ) : null}
    </div>
  );
}
