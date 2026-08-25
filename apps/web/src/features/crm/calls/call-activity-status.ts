import type { CallActivity } from '@/lib/api/calls';

export function isMissedCall(call: Pick<CallActivity, 'direction' | 'disposition'>): boolean {
  if (call.direction !== 'INBOUND' || !call.disposition) return false;
  const normalized = call.disposition.trim().toUpperCase().replace(/_/g, ' ');
  return normalized === 'NO ANSWER' || normalized === 'MISSED' || normalized === 'BUSY';
}

export function callActivityPartyName(call: Pick<CallActivity, 'contactName'>): string {
  const name = call.contactName?.trim();
  return name && name.length > 0 ? name : 'New caller';
}

export function formatCallActivityTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function readAudioDuration(duration: number, fallback: number): number {
  if (!Number.isFinite(duration) || duration <= 0) return fallback;
  return duration;
}
