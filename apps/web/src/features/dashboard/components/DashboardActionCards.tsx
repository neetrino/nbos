'use client';

import type { ReactNode } from 'react';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { ActionTileButton } from '@/components/shared';
import { PersonalLinkMark } from '@/components/shared/it-brand-mark/PersonalLinkMark';
import { Button } from '@/components/ui/button';
import {
  DASHBOARD_PINNED_TILE_MIN_HEIGHT_CLASS,
  getPinnedActionTone,
} from '../dashboard-pinned-action-tones';
import type { DashboardPersonalLink, PinnedAction } from '../dashboard-control-registry';
import { isPinnedOpenAction } from '../dashboard-pinned-action-kind';
import { cn } from '@/lib/utils';
import { PinnedActionKindMark } from './PinnedActionKindMark';
import { useTranslations } from 'next-intl';
import { DASHBOARD_ACTION_MESSAGE_KEYS } from '../dashboard-action-message-keys';
import { useDashboardCreateAction } from './DashboardCreateActionsProvider';

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
  hidden?: boolean;
  link: DashboardPersonalLink;
  onDelete?: () => Promise<void>;
  onEdit?: () => void;
}

export function PinnedActionCard({ action, variant = 'visible', editMode }: PinnedActionCardProps) {
  const t = useTranslations('dashboard');
  const openCreateAction = useDashboardCreateAction();
  const isHidden = variant === 'hidden';
  const Icon = isHidden ? Eye : action.icon;
  const isInteractive = !editMode && !isHidden;
  const openHref = isInteractive && isPinnedOpenAction(action) ? action.href : undefined;
  const messageKeys = DASHBOARD_ACTION_MESSAGE_KEYS[action.key];

  return (
    <DashboardPinnedTileShell>
      <ActionTileButton
        label={t(messageKeys.label)}
        title={t(messageKeys.description)}
        icon={<Icon aria-hidden />}
        tone={isHidden ? 'muted' : getPinnedActionTone(action.key)}
        size="lg"
        fullWidth
        wrapLabel
        className="h-full"
        href={openHref}
        onClick={
          isInteractive && action.kind === 'create' ? () => openCreateAction(action.key) : undefined
        }
        displayOnly={editMode || isHidden}
        trailing={<PinnedActionKindMark kind={action.kind} />}
      />
    </DashboardPinnedTileShell>
  );
}

export function PersonalLinkCard({
  editMode,
  hidden = false,
  link,
  onDelete,
  onEdit,
}: PersonalLinkCardProps) {
  return (
    <DashboardPinnedTileShell>
      <ActionTileButton
        label={link.label}
        icon={<PersonalLinkMark url={link.url} label={link.label} />}
        trailing={
          editMode && onEdit && onDelete ? (
            <PersonalLinkTileActions label={link.label} onDelete={onDelete} onEdit={onEdit} />
          ) : (
            <PinnedActionKindMark kind="open" />
          )
        }
        tone={hidden ? 'muted' : 'secondary'}
        size="lg"
        fullWidth
        wrapLabel
        className="h-full min-w-0"
        href={editMode ? undefined : link.url}
        external={link.isExternal}
        openInNewTab={link.openInNewTab}
        title={link.isExternal ? link.url : undefined}
        displayOnly={editMode}
      />
    </DashboardPinnedTileShell>
  );
}

function PersonalLinkTileActions({
  label,
  onDelete,
  onEdit,
}: {
  label: string;
  onDelete: () => Promise<void>;
  onEdit: () => void;
}) {
  const t = useTranslations('dashboard');
  return (
    <span className="flex shrink-0 items-center">
      <Button
        type="button"
        aria-label={t('personalLink.editNamedAria', { label })}
        variant="ghost"
        size="icon-xs"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          onEdit();
        }}
      >
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        aria-label={t('personalLink.deleteNamedAria', { label })}
        variant="ghost"
        size="icon-xs"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          void onDelete();
        }}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </span>
  );
}
