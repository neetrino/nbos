/**
 * Single-flight refresh registry for Next.js BFF.
 * Concurrent 401s for the same AuthSession share one Nest refresh. Different
 * sessions must never share credentials.
 */

import type { BackendRefreshResult } from './refresh-backend-session';

type RefreshFn = () => Promise<BackendRefreshResult>;
type RegistryEntry = { promise: Promise<BackendRefreshResult> };

const entries = new Map<string, RegistryEntry>();

export async function runSingleFlightRefresh(
  sessionId: string,
  refresh: RefreshFn,
): Promise<BackendRefreshResult> {
  const existing = entries.get(sessionId);
  if (existing) {
    return existing.promise;
  }

  const entry: RegistryEntry = { promise: Promise.resolve().then(refresh) };
  entries.set(sessionId, entry);

  try {
    return await entry.promise;
  } finally {
    // Share only work that is still in flight. Replaying a resolved Set-Cookie
    // can overwrite a newer rotation completed by another web replica.
    if (entries.get(sessionId) === entry) entries.delete(sessionId);
  }
}

export function resetRefreshRegistryForTests(): void {
  entries.clear();
}
