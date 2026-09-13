import type { CallActivity, CallDirection } from '@/lib/api/calls';

export function callActivityTitleKey(direction: CallDirection | null): string {
  if (direction === 'OUTBOUND') return 'calls.outgoingCallTitle';
  if (direction === 'INBOUND') return 'calls.incomingCallTitle';
  return 'calls.call';
}

export function formatCallActivityDay(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function groupCallActivitiesByDay(
  items: CallActivity[],
): Array<{ day: string; items: CallActivity[] }> {
  const groups = new Map<string, CallActivity[]>();
  for (const item of items) {
    const day = formatCallActivityDay(item.createdAt);
    const bucket = groups.get(day) ?? [];
    bucket.push(item);
    groups.set(day, bucket);
  }
  return [...groups.entries()].map(([day, grouped]) => ({ day, items: grouped }));
}
