'use client';

import { useTranslations } from 'next-intl';
import { useRecordingElapsed } from './use-recording-elapsed';

type VideoMeetingRecordingElapsedProps = {
  startedAt: string | null;
  running: boolean;
};

/** Digits beside the record control while capture is live. */
export function VideoMeetingRecordingElapsed({
  startedAt,
  running,
}: VideoMeetingRecordingElapsedProps) {
  const t = useTranslations('videoMeetings.recording');
  const elapsed = useRecordingElapsed(startedAt, running);
  if (!elapsed) return null;

  return (
    <span
      className="text-destructive min-w-11 text-center text-xs font-semibold tabular-nums"
      aria-label={t('elapsedAria', { time: elapsed })}
    >
      {elapsed}
    </span>
  );
}
