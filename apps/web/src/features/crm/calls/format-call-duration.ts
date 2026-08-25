const SECONDS_PER_MINUTE = 60;

export function formatCallDuration(durationSec: number | null): string {
  if (durationSec == null) return '—';
  const minutes = Math.floor(durationSec / SECONDS_PER_MINUTE);
  const seconds = durationSec % SECONDS_PER_MINUTE;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function formatCallPlaybackClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const whole = Math.floor(seconds);
  const minutes = Math.floor(whole / SECONDS_PER_MINUTE);
  const rest = whole % SECONDS_PER_MINUTE;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}
