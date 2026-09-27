'use client';

import { Play } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { formatRecordingElapsed } from './video-meeting-recording-elapsed';
import { VideoMeetingRecordingFrame } from './VideoMeetingRecordingFrame';

type VideoMeetingRecordingPreviewProps = {
  url: string | null;
  onOpen: () => void;
};

/** Centered play control with the recording length above it, over the frame. */
export function VideoMeetingRecordingPreview({ url, onOpen }: VideoMeetingRecordingPreviewProps) {
  const t = useTranslations('videoMeetings.recording');
  const [durationSeconds, setDurationSeconds] = useState<number | null>(null);
  const duration = durationSeconds === null ? null : formatRecordingElapsed(durationSeconds);

  return (
    <div className="relative overflow-hidden rounded-xl bg-neutral-950">
      {url ? (
        <VideoMeetingRecordingFrame url={url} onDuration={setDurationSeconds} />
      ) : (
        <div className="aspect-video w-full" />
      )}
      <button
        type="button"
        className="group absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-t from-black/50 via-black/20 to-black/35"
        aria-label={duration ? t('previewAria', { time: duration }) : t('openRecording')}
        disabled={!url}
        onClick={onOpen}
      >
        {duration ? <RecordingDuration time={duration} /> : <span className="h-5" aria-hidden />}
        <span className="inline-flex size-14 items-center justify-center rounded-full bg-white text-neutral-950 shadow-lg ring-1 ring-white/40 transition-transform group-hover:scale-105">
          <Play className="ml-0.5 size-6 fill-current" aria-hidden />
        </span>
      </button>
    </div>
  );
}

function RecordingDuration({ time }: { time: string }) {
  return (
    <span className="text-sm font-semibold tracking-wide text-white tabular-nums drop-shadow-sm">
      {time}
    </span>
  );
}
