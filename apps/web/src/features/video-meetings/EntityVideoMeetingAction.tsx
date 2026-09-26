'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Video } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getApiErrorMessage } from '@/lib/api-errors';
import { videoMeetingsApi, type VideoMeetingEntityLinkType } from '@/lib/api/video-meetings';
import { usePermission } from '@/lib/permissions';
import { isVideoMeetingsWebFeatureEnabled } from '@/lib/video-meetings/feature-flag';
import { canShowEntityVideoMeetingAction } from './entity-video-meeting-action-gate';

export interface EntityVideoMeetingActionProps {
  entityType: VideoMeetingEntityLinkType;
  entityId: string;
  /** Optional title prefix for the new meeting. */
  entityLabel?: string;
  variant?: 'button' | 'menu-item';
  className?: string;
}

/**
 * Lightweight cross-module entry: create an instant meeting with this entity
 * pre-linked, or attach an existing ended meeting. Not a second conference UI.
 */
export function EntityVideoMeetingAction({
  entityType,
  entityId,
  entityLabel,
  variant = 'button',
  className,
}: EntityVideoMeetingActionProps) {
  const t = useTranslations('videoMeetings');
  const router = useRouter();
  const { can } = usePermission();
  const [busy, setBusy] = useState(false);
  const visible = canShowEntityVideoMeetingAction({
    featureFlagEnv: process.env.NEXT_PUBLIC_VIDEO_MEETINGS_V1_ENABLED,
    canAdd: can('ADD', 'VIDEO_MEETINGS'),
    canEdit: can('EDIT', 'VIDEO_MEETINGS'),
  });

  const startNew = useCallback(async () => {
    if (!can('ADD', 'VIDEO_MEETINGS') && !can('EDIT', 'VIDEO_MEETINGS')) return;
    setBusy(true);
    try {
      const title = entityLabel ? t('crossModule.meetingTitle', { label: entityLabel }) : undefined;
      const meeting = await videoMeetingsApi.create(title);
      if (can('EDIT', 'VIDEO_MEETINGS')) {
        await videoMeetingsApi.attachEntityLink(meeting.id, entityType, entityId);
      }
      router.push(`/video-meetings/${meeting.id}`);
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, t('crossModule.actionError')));
    } finally {
      setBusy(false);
    }
  }, [can, entityId, entityLabel, entityType, router, t]);

  const linkExisting = useCallback(async () => {
    if (!can('EDIT', 'VIDEO_MEETINGS')) return;
    setBusy(true);
    try {
      const history = await videoMeetingsApi.history();
      const first = history.items[0];
      if (!first) {
        toast.error(t('crossModule.noEndedMeetings'));
        return;
      }
      await videoMeetingsApi.attachEntityLink(first.id, entityType, entityId);
      router.push(`/video-meetings/${first.id}`);
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, t('crossModule.actionError')));
    } finally {
      setBusy(false);
    }
  }, [can, entityId, entityType, router, t]);

  if (!visible || !isVideoMeetingsWebFeatureEnabled()) return null;

  if (variant === 'menu-item') {
    return (
      <>
        <DropdownMenuItem disabled={busy} onClick={() => void startNew()}>
          <Video className="size-4" />
          {t('crossModule.startNew')}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={busy || !can('EDIT', 'VIDEO_MEETINGS')}
          onClick={() => void linkExisting()}
        >
          <Video className="size-4" />
          {t('crossModule.linkExisting')}
        </DropdownMenuItem>
      </>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={(props) => (
          <Button
            {...props}
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            className={className}
            aria-label={t('crossModule.actionLabel')}
          >
            <Video className="size-4" />
            {t('crossModule.actionLabel')}
          </Button>
        )}
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled={busy} onClick={() => void startNew()}>
          {t('crossModule.startNew')}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={busy || !can('EDIT', 'VIDEO_MEETINGS')}
          onClick={() => void linkExisting()}
        >
          {t('crossModule.linkExisting')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
