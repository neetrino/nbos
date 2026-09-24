import {
  MAIL_PROVIDER_SYNCABLE_STATUSES,
  type MailProviderSyncableStatus,
} from './mail-sync-wait.constants';

export interface MailSyncWaitSnapshot {
  lastSyncAt: string | null;
  lastErrorAt: string | null;
  status: string;
}

export type MailSyncSettleState = 'pending' | 'completed' | 'failed';

export type MailSyncWaitOutcome = 'completed' | 'failed' | 'timeout';

export function isMailProviderSyncableStatus(status: string): status is MailProviderSyncableStatus {
  return (MAIL_PROVIDER_SYNCABLE_STATUSES as readonly string[]).includes(status);
}

export function mailAccountsForProviderSync<T extends { id: string; status: string }>(
  accounts: readonly T[],
  selectedAccountId: string | null,
): T[] {
  if (selectedAccountId) {
    return accounts.filter(
      (account) => account.id === selectedAccountId && isMailProviderSyncableStatus(account.status),
    );
  }
  return accounts.filter((account) => isMailProviderSyncableStatus(account.status));
}

export function mailSyncSnapshotFromAccount(account: MailSyncWaitSnapshot): MailSyncWaitSnapshot {
  return {
    lastSyncAt: account.lastSyncAt,
    lastErrorAt: account.lastErrorAt,
    status: account.status,
  };
}

export function resolveMailSyncSettleState(
  baseline: MailSyncWaitSnapshot,
  current: MailSyncWaitSnapshot,
): MailSyncSettleState {
  if (current.status === 'NEEDS_RECONNECT' && current.status !== baseline.status) {
    return 'failed';
  }
  if (current.lastErrorAt !== null && current.lastErrorAt !== baseline.lastErrorAt) {
    return 'failed';
  }
  if (current.lastSyncAt !== null && current.lastSyncAt !== baseline.lastSyncAt) {
    return 'completed';
  }
  return 'pending';
}

export function resolveMailSyncWaitOutcome(
  states: readonly MailSyncSettleState[],
): MailSyncWaitOutcome | 'pending' {
  if (states.length === 0) {
    return 'completed';
  }
  if (states.some((state) => state === 'pending')) {
    return 'pending';
  }
  if (states.every((state) => state === 'completed')) {
    return 'completed';
  }
  return 'failed';
}

export async function waitUntilMailSyncSettles(params: {
  accountIds: readonly string[];
  baselineById: ReadonlyMap<string, MailSyncWaitSnapshot>;
  loadSnapshots: () => Promise<ReadonlyMap<string, MailSyncWaitSnapshot>>;
  pollMs: number;
  timeoutMs: number;
  sleep: (ms: number) => Promise<void>;
  now: () => number;
}): Promise<MailSyncWaitOutcome> {
  const deadline = params.now() + params.timeoutMs;
  while (params.now() < deadline) {
    await params.sleep(params.pollMs);
    const snapshots = await params.loadSnapshots();
    const states = params.accountIds.map((accountId) => {
      const baseline = params.baselineById.get(accountId);
      const current = snapshots.get(accountId);
      if (!baseline || !current) {
        return 'pending' as const;
      }
      return resolveMailSyncSettleState(baseline, current);
    });
    const outcome = resolveMailSyncWaitOutcome(states);
    if (outcome !== 'pending') {
      return outcome;
    }
  }
  return 'timeout';
}
