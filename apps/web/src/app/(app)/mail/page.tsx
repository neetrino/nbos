'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { Mail, Plus } from 'lucide-react';

import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

import { useHeaderContext, useHeaderModuleTitle } from '@/components/layout/header-context';

import {
  EmptyState,
  ErrorState,
  LoadingState,
  ListPagination,
  SEARCH_DEBOUNCE_MS,
  useDebouncedValue,
} from '@/components/shared';

import {
  mailApi,
  type MailAccountHealthSummaryRow,
  type MailThreadListPageMeta,
  type MailThreadListRow,
} from '@/lib/api/mail';

import { getApiErrorMessage } from '@/lib/api-errors';

import { usePermission } from '@/lib/permissions';

import { MailActivePanelHost } from '@/features/mail/MailActivePanelHost';

import { MailBulkActionBar } from '@/features/mail/MailBulkActionBar';

import { MailFolderSidebar } from '@/features/mail/MailFolderSidebar';

import { MailThreadList } from '@/features/mail/MailThreadList';

import { MailToolbarRow } from '@/features/mail/MailToolbarRow';

import { activeMailThreadId, type ActiveMailPanel } from '@/features/mail/mail-active-panel';

import { mailFolderListParams, type MailFolderKey } from '@/features/mail/mail-folder-config';

function clearThreadSelection(setSelectedThreadIds: (ids: Set<string>) => void) {
  setSelectedThreadIds(new Set());
}

export default function MailInboxPage() {
  const { can } = usePermission();

  const canView = can('VIEW', 'MAIL');

  const canEdit = can('EDIT', 'MAIL');

  const [accountHealth, setAccountHealth] = useState<MailAccountHealthSummaryRow[]>([]);

  const [threads, setThreads] = useState<MailThreadListRow[]>([]);

  const [threadListMeta, setThreadListMeta] = useState<MailThreadListPageMeta | null>(null);

  const [threadPage, setThreadPage] = useState(1);

  const [filterAccountId, setFilterAccountId] = useState<string | null>(null);

  const [activeFolder, setActiveFolder] = useState<MailFolderKey>('all');

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [syncingAccountId, setSyncingAccountId] = useState<string | null>(null);

  const [bulkBusy, setBulkBusy] = useState(false);

  const [threadSearchDraft, setThreadSearchDraft] = useState('');

  const threadSearchQuery = useDebouncedValue(threadSearchDraft, SEARCH_DEBOUNCE_MS).trim();

  const [activePanel, setActivePanel] = useState<ActiveMailPanel>(null);

  const [selectedThreadIds, setSelectedThreadIds] = useState<Set<string>>(() => new Set());

  const selectedThreadId = activeMailThreadId(activePanel);

  useHeaderModuleTitle('Mail');

  const headerActions = useMemo(() => {
    if (!canEdit) {
      return null;
    }

    return {
      kind: 'actions' as const,

      ariaLabel: 'Mail actions',

      children: (
        <Button
          type="button"
          size="sm"
          disabled={accountHealth.length === 0 || loading || bulkBusy}
          onClick={() => setActivePanel({ type: 'compose', defaultAccountId: filterAccountId })}
        >
          <Plus size={16} aria-hidden />
          Compose
        </Button>
      ),
    };
  }, [canEdit, accountHealth.length, loading, bulkBusy, filterAccountId]);

  useHeaderContext(headerActions);

  const accountEmailById = useMemo(
    () => new Map(accountHealth.map((account) => [account.id, account.emailAddress])),

    [accountHealth],
  );

  const visibleThreadIds = useMemo(() => threads.map((thread) => thread.id), [threads]);

  const selectedCount = selectedThreadIds.size;

  const allVisibleSelected =
    visibleThreadIds.length > 0 && visibleThreadIds.every((id) => selectedThreadIds.has(id));

  useEffect(() => {
    setThreadPage(1);
  }, [threadSearchQuery]);

  useEffect(() => {
    setActivePanel(null);

    clearThreadSelection(setSelectedThreadIds);
  }, [filterAccountId, activeFolder, threadSearchQuery, threadPage]);

  const load = useCallback(async () => {
    setLoading(true);

    setError(null);

    try {
      const folderParams = mailFolderListParams(activeFolder);

      const [health, threadPageResult] = await Promise.all([
        mailApi.listAccountHealthSummaries(),

        mailApi.listThreads({
          mailAccountId: filterAccountId ?? undefined,

          search: threadSearchQuery || undefined,

          page: threadPage,

          ...folderParams,
        }),
      ]);

      setAccountHealth(health);

      setThreads(threadPageResult.items);

      setThreadListMeta(threadPageResult.meta);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, 'Mail could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, [activeFolder, filterAccountId, threadSearchQuery, threadPage]);

  const runSync = useCallback(
    async (accountId: string) => {
      setSyncingAccountId(accountId);

      try {
        await mailApi.syncAccount(accountId);

        toast.success('Sync started.');

        await load();
      } catch (syncError) {
        toast.error(getApiErrorMessage(syncError, 'Sync could not be started.'));
      } finally {
        setSyncingAccountId(null);
      }
    },

    [load],
  );

  useEffect(() => {
    if (!canView) {
      setLoading(false);

      return;
    }

    void load();
  }, [canView, load]);

  const selectAccount = (accountId: string | null) => {
    setThreadPage(1);

    setFilterAccountId(accountId);
  };

  const selectFolder = (folder: MailFolderKey) => {
    setThreadPage(1);

    setActiveFolder(folder);
  };

  const openThread = (threadId: string) => {
    setActivePanel({ type: 'thread', threadId });
  };

  const handleThreadMarkedRead = useCallback((threadId: string, mailAccountId: string) => {
    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === threadId && thread.hasUnread ? { ...thread, hasUnread: false } : thread,
      ),
    );

    setAccountHealth((prev) =>
      prev.map((account) =>
        account.id === mailAccountId && account.unreadThreadCount > 0
          ? { ...account, unreadThreadCount: account.unreadThreadCount - 1 }
          : account,
      ),
    );
  }, []);

  const handleThreadMarkedUnread = useCallback((threadId: string, mailAccountId: string) => {
    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === threadId && !thread.hasUnread ? { ...thread, hasUnread: true } : thread,
      ),
    );

    setAccountHealth((prev) =>
      prev.map((account) =>
        account.id === mailAccountId
          ? { ...account, unreadThreadCount: account.unreadThreadCount + 1 }
          : account,
      ),
    );
  }, []);

  const toggleThreadSelected = (threadId: string, checked: boolean) => {
    setSelectedThreadIds((prev) => {
      const next = new Set(prev);

      if (checked) {
        next.add(threadId);
      } else {
        next.delete(threadId);
      }

      return next;
    });
  };

  const toggleSelectAllVisible = (checked: boolean) => {
    if (!checked) {
      clearThreadSelection(setSelectedThreadIds);

      return;
    }

    setSelectedThreadIds(new Set(visibleThreadIds));
  };

  const runBulkMarkRead = async () => {
    const targets = threads.filter(
      (thread) => selectedThreadIds.has(thread.id) && thread.hasUnread,
    );

    if (targets.length === 0) {
      return;
    }

    setBulkBusy(true);

    try {
      for (const thread of targets) {
        await mailApi.markThreadRead(thread.id);

        handleThreadMarkedRead(thread.id, thread.mailAccountId);
      }

      clearThreadSelection(setSelectedThreadIds);

      toast.success(`Marked ${targets.length} thread${targets.length === 1 ? '' : 's'} as read.`);
    } catch (bulkError) {
      toast.error(getApiErrorMessage(bulkError, 'Bulk mark read failed.'));
    } finally {
      setBulkBusy(false);
    }
  };

  const runBulkMarkUnread = async () => {
    const targets = threads.filter(
      (thread) => selectedThreadIds.has(thread.id) && !thread.hasUnread,
    );

    if (targets.length === 0) {
      return;
    }

    setBulkBusy(true);

    try {
      for (const thread of targets) {
        await mailApi.markThreadUnread(thread.id);

        handleThreadMarkedUnread(thread.id, thread.mailAccountId);
      }

      clearThreadSelection(setSelectedThreadIds);

      toast.success(`Marked ${targets.length} thread${targets.length === 1 ? '' : 's'} as unread.`);
    } catch (bulkError) {
      toast.error(getApiErrorMessage(bulkError, 'Bulk mark unread failed.'));
    } finally {
      setBulkBusy(false);
    }
  };

  if (!canView) {
    return (
      <div className="flex h-full flex-col gap-5">
        <EmptyState
          icon={Mail}
          title="No access"
          description="You do not have permission to view Mail."
        />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <MailToolbarRow
        accounts={accountHealth}
        filterAccountId={filterAccountId}
        activeFolder={activeFolder}
        searchValue={threadSearchDraft}
        canEdit={canEdit}
        busy={loading || bulkBusy}
        syncingAccountId={syncingAccountId}
        onSelectAccount={selectAccount}
        onSelectFolder={selectFolder}
        onSearchChange={setThreadSearchDraft}
        onRefresh={() => void load()}
        onSyncAccount={(accountId) => void runSync(accountId)}
        onShareAccount={(account) =>
          setActivePanel({
            type: 'share',

            accountId: account.id,

            accountEmail: account.emailAddress,
          })
        }
        onConnectMailbox={() => setActivePanel({ type: 'connect' })}
      />

      <div className="flex min-h-0 flex-1">
        <MailFolderSidebar
          accounts={accountHealth}
          filterAccountId={filterAccountId}
          activeFolder={activeFolder}
          onSelectFolder={selectFolder}
        />

        <section className="flex min-h-0 min-w-0 flex-1 flex-col">
          {loading ? <LoadingState /> : null}

          {error ? <ErrorState description={error} onRetry={() => void load()} /> : null}

          {!loading && !error ? (
            <>
              <MailBulkActionBar
                visibleThreadCount={threads.length}
                selectedCount={selectedCount}
                allVisibleSelected={allVisibleSelected}
                busy={bulkBusy}
                canMarkUnread={canEdit}
                onToggleSelectAll={toggleSelectAllVisible}
                onMarkRead={() => void runBulkMarkRead()}
                onMarkUnread={() => void runBulkMarkUnread()}
                onClearSelection={() => clearThreadSelection(setSelectedThreadIds)}
                className="border-border rounded-none border-x-0 border-t-0 bg-transparent px-3 py-2"
              />

              {threads.length === 0 ? (
                <EmptyState
                  icon={Mail}
                  title="No threads"
                  description={
                    threadSearchQuery
                      ? 'No threads match this search.'
                      : 'Connect a mailbox or wait for the next sync.'
                  }
                />
              ) : (
                <div className="min-h-0 flex-1 overflow-y-auto">
                  <MailThreadList
                    threads={threads}
                    accountEmailById={accountEmailById}
                    selectedThreadId={selectedThreadId}
                    selectedThreadIds={selectedThreadIds}
                    bulkBusy={bulkBusy}
                    onOpenThread={openThread}
                    onToggleThreadSelected={toggleThreadSelected}
                  />
                </div>
              )}

              {threadListMeta && threadListMeta.totalCount > 0 ? (
                <ListPagination
                  className="border-border shrink-0 border-t px-3 py-2"
                  meta={{
                    total: threadListMeta.totalCount,

                    page: threadListMeta.page,

                    pageSize: threadListMeta.pageSize,

                    totalPages: threadListMeta.totalPages,
                  }}
                  onPageChange={setThreadPage}
                />
              ) : null}
            </>
          ) : null}
        </section>
      </div>

      <MailActivePanelHost
        activePanel={activePanel}
        onActivePanelChange={setActivePanel}
        accounts={accountHealth}
        canEdit={canEdit}
        onThreadMarkedRead={handleThreadMarkedRead}
        onThreadMarkedUnread={handleThreadMarkedUnread}
        onThreadMarkedSpam={(threadId) => {
          setActivePanel(null);
          setThreads((prev) => prev.filter((thread) => thread.id !== threadId));
          clearThreadSelection(setSelectedThreadIds);
        }}
        onMailboxConnected={() => void load()}
        onComposeSent={(threadId) => {
          setActivePanel({ type: 'thread', threadId });
          void load();
        }}
        trashView={activeFolder === 'trash'}
        onThreadDeleted={(threadId) => {
          setActivePanel(null);
          setThreads((prev) => prev.filter((thread) => thread.id !== threadId));
          clearThreadSelection(setSelectedThreadIds);
          toast.success('Moved to Trash.');
        }}
        onThreadRestored={(threadId) => {
          setActivePanel(null);
          setThreads((prev) => prev.filter((thread) => thread.id !== threadId));
          clearThreadSelection(setSelectedThreadIds);
          toast.success('Email restored to inbox.');
        }}
      />
    </div>
  );
}
