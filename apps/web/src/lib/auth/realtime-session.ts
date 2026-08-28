import { hasInvalidSessionHeader } from './session-state';
import { signOutForInvalidSession } from './session-sign-out';

export type RealtimeSessionResult =
  | { kind: 'available'; accessToken: string }
  | { kind: 'session-invalid' }
  | { kind: 'temporarily-unavailable' };

let recoveryInFlight: Promise<RealtimeSessionResult> | null = null;

async function inspectRealtimeSession(): Promise<RealtimeSessionResult> {
  try {
    const response = await fetch('/api/auth/realtime-token', { cache: 'no-store' });
    if (response.status === 401 && hasInvalidSessionHeader(response.headers)) {
      try {
        await signOutForInvalidSession();
      } catch {
        // The caller must still stop reconnecting when the server confirmed
        // invalidity, even if navigation/sign-out itself could not complete.
      }
      return { kind: 'session-invalid' };
    }
    if (!response.ok) return { kind: 'temporarily-unavailable' };

    const body = (await response.json()) as { token?: unknown };
    return typeof body.token === 'string'
      ? { kind: 'available', accessToken: body.token }
      : { kind: 'temporarily-unavailable' };
  } catch {
    return { kind: 'temporarily-unavailable' };
  }
}

/** Shared auth recovery for realtime transports; only a confirmed 401 signs out. */
export async function recoverRealtimeSession(): Promise<RealtimeSessionResult> {
  if (recoveryInFlight) return recoveryInFlight;
  recoveryInFlight = inspectRealtimeSession();
  try {
    return await recoveryInFlight;
  } finally {
    recoveryInFlight = null;
  }
}

export function resetRealtimeSessionRecoveryForTests(): void {
  recoveryInFlight = null;
}
