export type MessengerPresenceState = 'online' | 'offline';

export function parsePresenceSnapshot(payload: unknown): string[] | null {
  if (!payload || typeof payload !== 'object') return null;
  const raw = (payload as { employeeIds?: unknown }).employeeIds;
  if (!Array.isArray(raw)) return null;
  return raw.filter((id): id is string => typeof id === 'string' && id.trim().length > 0);
}

export function parsePresenceDelta(
  payload: unknown,
): { employeeId: string; state: MessengerPresenceState } | null {
  if (!payload || typeof payload !== 'object') return null;
  const employeeId = (payload as { employeeId?: unknown }).employeeId;
  const state = (payload as { state?: unknown }).state;
  if (typeof employeeId !== 'string' || employeeId.trim().length === 0) return null;
  if (state !== 'online' && state !== 'offline') return null;
  return { employeeId, state };
}

export function applyPresenceDelta(
  current: ReadonlySet<string>,
  employeeId: string,
  state: MessengerPresenceState,
): ReadonlySet<string> {
  const present = current.has(employeeId);
  if (state === 'offline') {
    if (!present) return current;
    const next = new Set(current);
    next.delete(employeeId);
    return next;
  }
  if (present) return current;
  const next = new Set(current);
  next.add(employeeId);
  return next;
}
