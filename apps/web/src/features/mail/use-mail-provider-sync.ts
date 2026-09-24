'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api-errors';
import { mailApi, type MailAccountHealthSummaryRow } from '@/lib/api/mail';
import {
  MAIL_PROVIDER_SYNC_POLL_MS,
  MAIL_PROVIDER_SYNC_TIMEOUT_MS,
} from './mail-sync-wait.constants';
import {
  mailAccountsForProviderSync,
  mailSyncSnapshotFromAccount,
  waitUntilMailSyncSettles,
  type MailSyncWaitOutcome,
  type MailSyncWaitSnapshot,
} from './mail-sync-wait';

export interface UseMailProviderSyncParams {
  canEdit: boolean;
  accounts: MailAccountHealthSummaryRow[];
  filterAccountId: string | null;
  onListReload: () => Promise<void>;
}

function sleepMs(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function toastMailSyncOutcome(outcome: MailSyncWaitOutcome, mailboxCount: number): void {
  if (outcome === 'completed') {
    toast.success(mailboxCount > 1 ? 'Mailboxes updated.' : 'Mailbox updated.');
    return;
  }
  if (outcome === 'failed') {
    toast.error('Mailbox sync failed. Check connection or reconnect.');
    return;
  }
  toast.message('Sync is still running. The list updates when it finishes.');
}

async function loadHealthSnapshots(): Promise<Map<string, MailSyncWaitSnapshot>> {
  const health = await mailApi.listAccountHealthSummaries();
  return new Map(health.map((row) => [row.id, mailSyncSnapshotFromAccount(row)]));
}

async function enqueueMailboxSyncs(accountIds: readonly string[]): Promise<string[]> {
  const waitingIds: string[] = [];
  for (const accountId of accountIds) {
    const result = await mailApi.syncAccount(accountId);
    if (result.queued) {
      waitingIds.push(accountId);
    }
  }
  return waitingIds;
}

async function waitForQueuedMailboxSyncs(
  waitingIds: readonly string[],
  baselineById: ReadonlyMap<string, MailSyncWaitSnapshot>,
): Promise<MailSyncWaitOutcome> {
  return waitUntilMailSyncSettles({
    accountIds: waitingIds,
    baselineById,
    loadSnapshots: loadHealthSnapshots,
    pollMs: MAIL_PROVIDER_SYNC_POLL_MS,
    timeoutMs: MAIL_PROVIDER_SYNC_TIMEOUT_MS,
    sleep: sleepMs,
    now: () => Date.now(),
  });
}

export function useMailProviderSync({
  canEdit,
  accounts,
  filterAccountId,
  onListReload,
}: UseMailProviderSyncParams) {
  const [providerSyncBusy, setProviderSyncBusy] = useState(false);

  const runProviderSync = useCallback(
    async (accountIds: readonly string[]) => {
      if (accountIds.length === 0) {
        await onListReload();
        return;
      }
      setProviderSyncBusy(true);
      try {
        const baselineById = new Map(
          accounts
            .filter((account) => accountIds.includes(account.id))
            .map((account) => [account.id, mailSyncSnapshotFromAccount(account)]),
        );
        const waitingIds = await enqueueMailboxSyncs(accountIds);
        if (waitingIds.length > 0) {
          const outcome = await waitForQueuedMailboxSyncs(waitingIds, baselineById);
          toastMailSyncOutcome(outcome, waitingIds.length);
        } else {
          toast.success(accountIds.length > 1 ? 'Mailboxes updated.' : 'Mailbox updated.');
        }
        await onListReload();
      } catch (syncError) {
        toast.error(getApiErrorMessage(syncError, 'Sync could not be started.'));
      } finally {
        setProviderSyncBusy(false);
      }
    },
    [accounts, onListReload],
  );

  const refreshFromProvider = useCallback(async () => {
    if (!canEdit) {
      await onListReload();
      return;
    }
    const targets = mailAccountsForProviderSync(accounts, filterAccountId);
    if (targets.length === 0) {
      if (filterAccountId) {
        toast.error('This mailbox cannot sync. Reconnect it first.');
      }
      await onListReload();
      return;
    }
    await runProviderSync(targets.map((account) => account.id));
  }, [accounts, canEdit, filterAccountId, onListReload, runProviderSync]);

  return { providerSyncBusy, refreshFromProvider };
}
