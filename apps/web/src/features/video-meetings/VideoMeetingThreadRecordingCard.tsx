'use client';

import { useCallback, useState } from 'react';
import { Play } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import type { VideoMeetingThreadRecording } from '@/lib/api/video-meetings-thread';
import { videoMeetingRecordingPlaybackApi } from '@/lib/api/video-meetings-recording-playback';
import { recordingGroupStatusKey } from './video-meeting-recording-labels';

type VideoMeetingThreadRecordingCardProps = {
  meetingId: string;
  recording: VideoMeetingThreadRecording;
};

export function VideoMeetingThreadRecordingCard({
  meetingId,
  recording,
}: VideoMeetingThreadRecordingCardProps) {
  const t = useTranslations('videoMeetings.recording');
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPlayback = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await videoMeetingRecordingPlaybackApi.getForRecording(
        meetingId,
        recording.id,
      );
      setPlaybackUrl(result.url);
    } catch {
      setError(t('playbackError'));
      setPlaybackUrl(null);
    } finally {
      setBusy(false);
    }
  }, [meetingId, recording.id, t]);

  return (
    <article className="border-border bg-muted/30 flex max-w-md flex-col gap-2 rounded-2xl border px-3 py-2">
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {t('label')}
      </p>
      <p className="text-sm">{t(recordingGroupStatusKey(recording.status))}</p>
      {recording.playable ? (
        <div className="flex flex-col gap-2">
          {!playbackUrl ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={busy}
              onClick={() => void loadPlayback()}
            >
              <Play className="size-4" aria-hidden />
              {busy ? t('playbackLoading') : t('playComposite')}
            </Button>
          ) : (
            <video className="bg-muted max-h-48 w-full rounded-md" controls src={playbackUrl}>
              <track kind="captions" />
            </video>
          )}
          {error ? <p className="text-destructive text-xs">{error}</p> : null}
        </div>
      ) : null}
    </article>
  );
}
