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
import { videoMeetingThreadApi } from '@/lib/api/video-meetings-thread';
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
 * Lightweight cross-module entry: open the linked room for this record,
 * or create one. Another room is an explicit secondary action.
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

  const createLinkedMeeting = useCallback(async () => {
    const title = entityLabel ? t('crossModule.meetingTitle', { label: entityLabel }) : undefined;
    const meeting = await videoMeetingsApi.create(title);
    if (can('EDIT', 'VIDEO_MEETINGS')) {
      await videoMeetingsApi.attachEntityLink(meeting.id, entityType, entityId);
    }
    router.push(`/video-meetings/${meeting.id}`);
  }, [can, entityId, entityLabel, entityType, router, t]);

  const runBusy = useCallback(
    async (action: () => Promise<void>) => {
      if (!can('ADD', 'VIDEO_MEETINGS') && !can('EDIT', 'VIDEO_MEETINGS')) return;
      setBusy(true);
      try {
        await action();
      } catch (caught) {
        toast.error(getApiErrorMessage(caught, t('crossModule.actionError')));
      } finally {
        setBusy(false);
      }
    },
    [can, t],
  );

  const createLinked = useCallback(
    () => void runBusy(() => createLinkedMeeting()),
    [createLinkedMeeting, runBusy],
  );

  const openOrCreate = useCallback(
    () =>
      void runBusy(async () => {
        const existing = await videoMeetingThreadApi.getByEntity(entityType, entityId);
        if (existing) {
          router.push(`/video-meetings/${existing.id}`);
          return;
        }
        await createLinkedMeeting();
      }),
    [createLinkedMeeting, entityId, entityType, router, runBusy],
  );

  if (!visible || !isVideoMeetingsWebFeatureEnabled()) return null;

  if (variant === 'menu-item') {
    return (
      <>
        <DropdownMenuItem disabled={busy} onClick={openOrCreate}>
          <Video className="size-4" />
          {t('crossModule.openRoom')}
        </DropdownMenuItem>
        <DropdownMenuItem disabled={busy} onClick={createLinked}>
          <Video className="size-4" />
          {t('crossModule.startNew')}
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
        <DropdownMenuItem disabled={busy} onClick={openOrCreate}>
          {t('crossModule.openRoom')}
        </DropdownMenuItem>
        <DropdownMenuItem disabled={busy} onClick={createLinked}>
          {t('crossModule.startNew')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
