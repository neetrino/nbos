export type MailWatchStatus = 'not_configured' | 'active' | 'expired';
export type MailIdleStatus = 'held' | 'none';

const IDLE_HELD_MAX_AGE_MS = 90_000;

export function resolveMailWatchStatus(params: {
  providerType: string;
  gmailWatchConfigured: boolean;
  watchExpiresAt: Date | null;
  now?: Date;
}): MailWatchStatus {
  if (params.providerType !== 'GMAIL' || !params.gmailWatchConfigured) {
    return 'not_configured';
  }
  const expiresAt = params.watchExpiresAt;
  if (!expiresAt || expiresAt.getTime() <= (params.now ?? new Date()).getTime()) {
    return 'expired';
  }
  return 'active';
}

export function resolveMailIdleStatus(
  heartbeatAt: Date | null,
  now: Date = new Date(),
): MailIdleStatus {
  if (!heartbeatAt) {
    return 'none';
  }
  return now.getTime() - heartbeatAt.getTime() <= IDLE_HELD_MAX_AGE_MS ? 'held' : 'none';
}
