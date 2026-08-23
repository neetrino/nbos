const SECONDS_PER_MINUTE = 60;

export function formatCallDuration(durationSec: number | null): string {
  if (durationSec == null) return '—';
  const minutes = Math.floor(durationSec / SECONDS_PER_MINUTE);
  const seconds = durationSec % SECONDS_PER_MINUTE;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
