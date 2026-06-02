export function formatTeamSource(source: string): string {
  return source.replace(/_/g, ' ').toLowerCase();
}

export function formatProductSlot(slot: string | null): string {
  if (!slot) return '—';
  return slot.replace(/_/g, ' ').toLowerCase();
}
