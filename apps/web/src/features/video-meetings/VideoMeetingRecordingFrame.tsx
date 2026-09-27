'use client';

import type { SyntheticEvent } from 'react';

/** Seek this far before the end so the poster is a real frame, not a trailing blank. */
const RECORDING_POSTER_LEAD_SECONDS = 0.5;

type VideoMeetingRecordingFrameProps = {
  url: string;
  onDuration?: (seconds: number) => void;
};

function readDuration(video: HTMLVideoElement): number | null {
  if (!Number.isFinite(video.duration) || video.duration <= 0) return null;
  return Math.floor(video.duration);
}

function showLateFrame(video: HTMLVideoElement): void {
  const duration = readDuration(video);
  if (duration === null) return;
  const lead = Math.min(RECORDING_POSTER_LEAD_SECONDS, video.duration);
  video.currentTime = Math.max(0, video.duration - lead);
}

/** Paused preview of a late frame. Playback stays in the large viewer. */
export function VideoMeetingRecordingFrame({ url, onDuration }: VideoMeetingRecordingFrameProps) {
  const onLoadedMetadata = (event: SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    const duration = readDuration(video);
    if (duration !== null) onDuration?.(duration);
    showLateFrame(video);
  };

  return (
    <video
      muted
      playsInline
      preload="auto"
      src={url}
      onLoadedMetadata={onLoadedMetadata}
      className="pointer-events-none aspect-video w-full bg-neutral-950 object-cover"
    >
      <track kind="captions" />
    </video>
  );
}
