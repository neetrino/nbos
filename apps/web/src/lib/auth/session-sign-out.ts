import { scheduleMessengerPersistStoreClear } from '@/features/messenger/persist/messenger-persist-controller';
import { purgeMessengerPersistForSignOut } from '@/features/messenger/persist/messenger-persist-session';

let sessionSignOutInFlight: Promise<void> | null = null;

/** Central client sign-out: purge Messenger memory, then NextAuth. Storage clear is best-effort. */
export async function signOutClient(callbackUrl = '/sign-in'): Promise<void> {
  purgeMessengerPersistForSignOut();
  if (!sessionSignOutInFlight) {
    scheduleMessengerPersistStoreClear();
    sessionSignOutInFlight = startNextAuthSignOut(callbackUrl);
  }
  await sessionSignOutInFlight;
}

async function startNextAuthSignOut(callbackUrl: string): Promise<void> {
  try {
    const { signOut } = await import('next-auth/react');
    await signOut({ callbackUrl });
  } finally {
    sessionSignOutInFlight = null;
  }
}

/** Deduplicates invalid-session sign-out across Axios, SSE and Socket.IO. */
export async function signOutForInvalidSession(): Promise<void> {
  await signOutClient('/sign-in');
}

export function resetSessionSignOutForTests(): void {
  sessionSignOutInFlight = null;
}
