let sessionSignOutInFlight: Promise<void> | null = null;

/** Deduplicates invalid-session sign-out across Axios, SSE and Socket.IO. */
export async function signOutForInvalidSession(): Promise<void> {
  if (sessionSignOutInFlight) {
    await sessionSignOutInFlight;
    return;
  }

  sessionSignOutInFlight = (async () => {
    const { signOut } = await import('next-auth/react');
    await signOut({ callbackUrl: '/sign-in' });
  })();

  try {
    await sessionSignOutInFlight;
  } finally {
    sessionSignOutInFlight = null;
  }
}

export function resetSessionSignOutForTests(): void {
  sessionSignOutInFlight = null;
}
