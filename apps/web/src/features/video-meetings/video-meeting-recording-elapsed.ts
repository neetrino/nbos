const RECORDING_ELAPSED_TICK_MS = 1000;
const RECORDING_SECONDS_PER_MINUTE = 60;
const RECORDING_SECONDS_PER_HOUR = 3600;
const PAD_WIDTH = 2;

/** `mm:ss`, or `h:mm:ss` once the recording passes an hour. */
export function formatRecordingElapsed(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / RECORDING_SECONDS_PER_HOUR);
  const minutes = Math.floor((safe % RECORDING_SECONDS_PER_HOUR) / RECORDING_SECONDS_PER_MINUTE);
  const seconds = safe % RECORDING_SECONDS_PER_MINUTE;
  const clock = `${String(minutes).padStart(PAD_WIDTH, '0')}:${String(seconds).padStart(PAD_WIDTH, '0')}`;
  if (hours <= 0) return clock;
  return `${hours}:${clock}`;
}

export function recordingElapsedSeconds(startedAt: string, nowMs: number): number | null {
  const startedMs = Date.parse(startedAt);
  if (Number.isNaN(startedMs)) return null;
  return Math.max(0, Math.floor((nowMs - startedMs) / RECORDING_ELAPSED_TICK_MS));
}

export { RECORDING_ELAPSED_TICK_MS };
