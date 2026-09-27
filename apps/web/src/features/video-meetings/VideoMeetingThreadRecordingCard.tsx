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
    <article className="w-full max-w-sm">
      <VideoMeetingRecordingPreview
        people={recording.participants ?? []}
        durationSeconds={recording.durationSeconds ?? null}
        statusLabel={t(recordingGroupStatusKey(recording.status))}
        url={url}
        playable={recording.playable}
        onOpen={() => setOpen(true)}
      />
      {error ? <p className="text-destructive mt-1 px-1 text-xs">{error}</p> : null}
      <VideoMeetingRecordingPlayerDialog
        open={open}
        title={t('playbackTitle')}
        url={url}
        onOpenChange={setOpen}
      />
    </article>
  );
}
