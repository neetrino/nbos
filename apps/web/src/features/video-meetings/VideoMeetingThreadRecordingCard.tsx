'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { VideoMeetingThreadRecording } from '@/lib/api/video-meetings-thread';
import { recordingGroupStatusKey } from './video-meeting-recording-labels';
import { VideoMeetingRecordingPlayerDialog } from './VideoMeetingRecordingPlayerDialog';
import { VideoMeetingRecordingPreview } from './VideoMeetingRecordingPreview';
import { useVideoMeetingRecordingPlaybackUrl } from './use-video-meeting-recording-playback-url';

type VideoMeetingThreadRecordingCardProps = {
  meetingId: string;
  recording: VideoMeetingThreadRecording;
};

export function VideoMeetingThreadRecordingCard({
  meetingId,
  recording,
}: VideoMeetingThreadRecordingCardProps) {
  const t = useTranslations('videoMeetings.recording');
  const [open, setOpen] = useState(false);
  const { url, error } = useVideoMeetingRecordingPlaybackUrl(
    meetingId,
    recording.id,
    recording.playable,
  );

  return (
    <article className="border-border bg-muted/30 flex w-full max-w-sm flex-col gap-2 rounded-2xl border p-2">
      <div className="flex items-center justify-between gap-2 px-1">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {t('label')}
        </p>
        <p className="text-muted-foreground text-xs">
          {t(recordingGroupStatusKey(recording.status))}
        </p>
      </div>
      {recording.playable ? (
        <VideoMeetingRecordingPreview url={url} onOpen={() => setOpen(true)} />
      ) : null}
      {error ? <p className="text-destructive px-1 text-xs">{error}</p> : null}
      <VideoMeetingRecordingPlayerDialog
        open={open}
        title={t('playbackTitle')}
        url={url}
        onOpenChange={setOpen}
      />
    </article>
  );
}
