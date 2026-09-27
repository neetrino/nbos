'use client';

import Link from 'next/link';
import { Video, VideoOff } from 'lucide-react';
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

/** Cancel a room that has not started. Ending a live call is the video button. */
export function VideoMeetingCornerAction({
  status,
  canManage,
  busy,
  onCancel,
}: Omit<VideoMeetingDetailActionsProps, 'meetingId' | 'onStart' | 'onEnd'>) {
  const t = useTranslations('videoMeetings');
  const canCancel = canManage && (status === 'CREATED' || status === 'WAITING');
  if (!canCancel) return null;

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="text-muted-foreground h-8 px-2 text-xs"
      disabled={busy}
      onClick={onCancel}
    >
      {t('actions.cancelMeeting')}
    </Button>
  );
}

/** Start a call, or end it once this room is already live. */
export function VideoMeetingLaunchAction({
  meetingId,
  status,
  canManage,
  busy,
  onStart,
  onEnd,
}: Omit<VideoMeetingDetailActionsProps, 'onCancel'>) {
  const t = useTranslations('videoMeetings');
  const live = status === 'ACTIVE';
  if (canManage && live) {
    return (
      <Button type="button" variant="destructive" className="gap-2" disabled={busy} onClick={onEnd}>
        <VideoOff className="size-4" aria-hidden />
        {t('actions.endMeeting')}
      </Button>
    );
  }

  if (live) {
    return (
      <Link href={`/video-meetings/${meetingId}/room`} className={cn(buttonVariants(), 'gap-2')}>
        <Video className="size-4" aria-hidden />
        {t('actions.videoCall')}
      </Link>
    );
  }

  if (!canManage || status === 'CANCELLED') return null;

  return (
    <Button type="button" className="gap-2" disabled={busy} onClick={onStart}>
      <Video className="size-4" aria-hidden />
      {t('actions.videoCall')}
    </Button>
  );
}
