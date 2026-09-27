'use client';

import { useEffect, useState } from 'react';
import {
  RECORDING_ELAPSED_TICK_MS,
  formatRecordingElapsed,
  recordingElapsedSeconds,
} from './video-meeting-recording-elapsed';

/** Digital clock for an in-progress recording, ticking once a second. */
export function useRecordingElapsed(startedAt: string | null, running: boolean): string | null {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!running) return undefined;
    const timer = window.setInterval(() => setNowMs(Date.now()), RECORDING_ELAPSED_TICK_MS);
    return () => window.clearInterval(timer);
  }, [running]);

  if (!running || !startedAt) return null;
  const elapsed = recordingElapsedSeconds(startedAt, nowMs);
  if (elapsed === null) return null;
  return formatRecordingElapsed(elapsed);
}
