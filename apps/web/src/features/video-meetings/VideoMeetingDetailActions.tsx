'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { VideoMeetingCard } from '@/lib/api/video-meetings';

type VideoMeetingDetailActionsProps = {
  meetingId: string;
  status: VideoMeetingCard['status'];
  canManage: boolean;
  busy: boolean;
  onStart: () => void;
  onEnd: () => void;
  onCancel: () => void;
};

const CORNER_BUTTON_CLASS = 'h-7 px-2 text-xs';

/** Small dismiss action in the sheet corner: cancel before start, end once live. */
export function VideoMeetingCornerAction({
  status,
  canManage,
  busy,
  onEnd,
  onCancel,
}: Omit<VideoMeetingDetailActionsProps, 'meetingId' | 'onStart'>) {
  const t = useTranslations('videoMeetings');
  const canCancel = canManage && (status === 'CREATED' || status === 'WAITING');
  const canEnd = canManage && status === 'ACTIVE';
  if (!canCancel && !canEnd) return null;

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn(CORNER_BUTTON_CLASS, 'text-muted-foreground absolute top-3 right-4 z-10')}
      disabled={busy}
      onClick={canEnd ? onEnd : onCancel}
    >
      {canEnd ? t('actions.endMeeting') : t('actions.cancelMeeting')}
    </Button>
  );
}

/** Full-width launch pinned to the bottom of the sheet. */
export function VideoMeetingLaunchAction({
  meetingId,
  status,
  canManage,
  busy,
  onStart,
}: Omit<VideoMeetingDetailActionsProps, 'onEnd' | 'onCancel'>) {
  const t = useTranslations('videoMeetings');
  const live = status === 'ACTIVE';
  const canStart = canManage && !live && status !== 'ENDED' && status !== 'CANCELLED';
  if (!canStart && !live) return null;

  return (
    <footer className="border-border shrink-0 border-t px-5 py-4">
      {live ? (
        <Link
          href={`/video-meetings/${meetingId}/room`}
          className={cn(buttonVariants({ size: 'form' }), 'h-11 w-full text-base')}
        >
          {t('actions.joinRoom')}
        </Link>
      ) : (
        <Button
          type="button"
          size="form"
          className="h-11 w-full text-base"
          disabled={busy}
          onClick={onStart}
        >
          {t('actions.startMeeting')}
        </Button>
      )}
    </footer>
  );
}
