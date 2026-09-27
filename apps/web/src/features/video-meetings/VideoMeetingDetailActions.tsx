'use client';

import Link from 'next/link';
import { Video } from 'lucide-react';
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

/** Quiet dismiss next to the call button: cancel before start, end once live. */
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
      className="text-muted-foreground h-8 px-2 text-xs"
      disabled={busy}
      onClick={canEnd ? onEnd : onCancel}
    >
      {canEnd ? t('actions.endMeeting') : t('actions.cancelMeeting')}
    </Button>
  );
}

/** Compact call control for the chat header. */
export function VideoMeetingLaunchAction({
  meetingId,
  status,
  canManage,
  busy,
  onStart,
}: Omit<VideoMeetingDetailActionsProps, 'onEnd' | 'onCancel'>) {
  const t = useTranslations('videoMeetings');
  const live = status === 'ACTIVE';
  const canStart = canManage && !live && status !== 'CANCELLED';
  if (!canStart && !live) return null;

  const label = t('actions.videoCall');

  if (live) {
    return (
      <Link href={`/video-meetings/${meetingId}/room`} className={cn(buttonVariants(), 'gap-2')}>
        <Video className="size-4" aria-hidden />
        {label}
      </Link>
    );
  }

  return (
    <Button type="button" className="gap-2" disabled={busy} onClick={onStart}>
      <Video className="size-4" aria-hidden />
      {label}
    </Button>
  );
}
