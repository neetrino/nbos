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

/** One primary launch action. End and cancel stay secondary so they do not compete with start. */
export function VideoMeetingDetailActions({
  meetingId,
  status,
  canManage,
  busy,
  onStart,
  onEnd,
  onCancel,
}: VideoMeetingDetailActionsProps) {
  const t = useTranslations('videoMeetings');
  const live = status === 'ACTIVE';
  const canStart = canManage && !live && status !== 'ENDED' && status !== 'CANCELLED';
  const canCancel = canManage && (status === 'CREATED' || status === 'WAITING');

  return (
    <div className="flex flex-wrap items-center gap-3">
      {canStart ? (
        <Button type="button" size="form" disabled={busy} onClick={onStart}>
          {t('actions.startMeeting')}
        </Button>
      ) : null}
      {live ? (
        <Link
          href={`/video-meetings/${meetingId}/room`}
          className={cn(buttonVariants({ size: 'form' }))}
        >
          {t('actions.joinRoom')}
        </Link>
      ) : null}
      {live && canManage ? (
        <Button
          type="button"
          size="form"
          variant="destructive"
          className="bg-destructive hover:bg-destructive/90 text-white"
          disabled={busy}
          onClick={onEnd}
        >
          {t('actions.endMeeting')}
        </Button>
      ) : null}
      {canCancel ? (
        <Button type="button" variant="ghost" disabled={busy} onClick={onCancel}>
          {t('actions.cancelMeeting')}
        </Button>
      ) : null}
    </div>
  );
}
