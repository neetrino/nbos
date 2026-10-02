'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { videoMeetingRecordingPlaybackApi } from '@/lib/api/video-meetings-recording-playback';

/** Signed composite URL for one playable recording. Empty until the request resolves. */
export function useVideoMeetingRecordingPlaybackUrl(
  meetingId: string,
  recordingId: string,
  enabled: boolean,
): { url: string | null; error: string | null } {
  const t = useTranslations('videoMeetings.recording');
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    void videoMeetingRecordingPlaybackApi
      .getForRecording(meetingId, recordingId)
      .then((result) => {
        if (!cancelled) setUrl(result.url);
      })
      .catch(() => {
        if (!cancelled) setError(t('playbackError'));
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, meetingId, recordingId, t]);

  return { url, error };
}
