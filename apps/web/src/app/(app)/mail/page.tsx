'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { Mail, Plus } from 'lucide-react';

import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

import { useHeaderContext, useHeaderModuleTitle } from '@/components/layout/header-context';

import {
  DeleteConfirmDialog,
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
import {
  MAIL_ACCOUNT_QUERY_KEY,
  MAIL_OPEN_CONNECT_MAILBOX_QUERY_KEY,
  MAIL_OPEN_SHARE_MAILBOX_QUERY_KEY,
  MAIL_OPEN_THREAD_QUERY_KEY,
} from '@/features/mail/mail-query-params';

import { MailBulkActionBar } from '@/features/mail/MailBulkActionBar';

import { MailFolderSidebar } from '@/features/mail/MailFolderSidebar';

import { MailThreadList } from '@/features/mail/MailThreadList';

import { MailToolbarRow } from '@/features/mail/MailToolbarRow';

import {
  activeMailThreadId,
  type ActiveMailPanel,
  type MailOverlayPanel,
} from '@/features/mail/mail-active-panel';

import { mailFolderListParams, type MailFolderKey } from '@/features/mail/mail-folder-config';

function clearThreadSelection(setSelectedThreadIds: (ids: Set<string>) => void) {
  setSelectedThreadIds(new Set());
}

export default function MailInboxPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
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
  const [overlayPanel, setOverlayPanel] = useState<MailOverlayPanel>(null);

  const [selectedThreadIds, setSelectedThreadIds] = useState<Set<string>>(() => new Set());
  const [oauthHandled, setOauthHandled] = useState(false);
  const [deleteMailboxTarget, setDeleteMailboxTarget] = useState<{
    id: string;
    emailAddress: string;
  } | null>(null);
  const [disconnectingMailbox, setDisconnectingMailbox] = useState(false);

  const selectedThreadId = activeMailThreadId(activePanel);
  const oauthConnected = searchParams.get('connected');
  const oauthAccountId = searchParams.get(MAIL_ACCOUNT_QUERY_KEY);
  const oauthStatus = searchParams.get('oauth');
  const oauthReason = searchParams.get('reason');
  const queryAccountId = searchParams.get(MAIL_ACCOUNT_QUERY_KEY)?.trim() || null;
  const queryOpenThreadId = searchParams.get(MAIL_OPEN_THREAD_QUERY_KEY)?.trim() || null;
  const queryOpenShareMailboxId =
    searchParams.get(MAIL_OPEN_SHARE_MAILBOX_QUERY_KEY)?.trim() || null;
  const queryOpenConnectMailbox =
    searchParams.get(MAIL_OPEN_CONNECT_MAILBOX_QUERY_KEY)?.trim() || null;

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
    setOverlayPanel(null);

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

  const updateMailQuery = useCallback(
    (mutate: (params: URLSearchParams) => void, mode: 'push' | 'replace' = 'replace') => {
      const before = searchParams.toString();
      const next = new URLSearchParams(before);
      mutate(next);
      const after = next.toString();
      if (after === before) {
        return;
      }
      const href = after ? `${pathname}?${after}` : pathname;
      if (mode === 'push') {
        router.push(href, { scroll: false });
        return;
      }
      router.replace(href, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const clearOauthOnlyParams = useCallback(() => {
    updateMailQuery((params) => {
      params.delete('connected');
      params.delete('oauth');
      params.delete('reason');
    });
  }, [updateMailQuery]);

  const runDisconnectMailbox = useCallback(async () => {
    if (!deleteMailboxTarget) {
      return;
    }
    setDisconnectingMailbox(true);
    try {
      await mailApi.disconnectAccount(deleteMailboxTarget.id);
      toast.success('Mailbox disconnected.');
      setDeleteMailboxTarget(null);
      setFilterAccountId(null);
      setActivePanel(null);
      setOverlayPanel(null);
      clearThreadSelection(setSelectedThreadIds);
      updateMailQuery((params) => {
        params.delete(MAIL_ACCOUNT_QUERY_KEY);
        params.delete(MAIL_OPEN_THREAD_QUERY_KEY);
        params.delete(MAIL_OPEN_SHARE_MAILBOX_QUERY_KEY);
        params.delete(MAIL_OPEN_CONNECT_MAILBOX_QUERY_KEY);
      });
      await load();
    } catch (disconnectError) {
      toast.error(getApiErrorMessage(disconnectError, 'Mailbox could not be disconnected.'));
    } finally {
      setDisconnectingMailbox(false);
    }
  }, [deleteMailboxTarget, load, updateMailQuery]);

  useEffect(() => {
    if (!canView) {
      setLoading(false);

      return;
    }

    void load();
  }, [canView, load]);

  const handleActivePanelChange = useCallback(
    (panel: ActiveMailPanel) => {
      setActivePanel(panel);
      if (panel?.type !== 'thread') {
        setOverlayPanel(null);
      }
      updateMailQuery(
        (params) => {
          if (panel?.type === 'thread') {
            params.set(MAIL_OPEN_THREAD_QUERY_KEY, panel.threadId);
            params.delete(MAIL_OPEN_SHARE_MAILBOX_QUERY_KEY);
            params.delete(MAIL_OPEN_CONNECT_MAILBOX_QUERY_KEY);
            return;
          }
          if (panel?.type === 'share') {
            params.set(MAIL_OPEN_SHARE_MAILBOX_QUERY_KEY, panel.accountId);
            params.set(MAIL_ACCOUNT_QUERY_KEY, panel.accountId);
            params.delete(MAIL_OPEN_THREAD_QUERY_KEY);
            params.delete(MAIL_OPEN_CONNECT_MAILBOX_QUERY_KEY);
            return;
          }
          if (panel?.type === 'connect') {
            params.set(MAIL_OPEN_CONNECT_MAILBOX_QUERY_KEY, '1');
            params.delete(MAIL_OPEN_THREAD_QUERY_KEY);
            params.delete(MAIL_OPEN_SHARE_MAILBOX_QUERY_KEY);
            return;
          }
          if (panel === null && activePanel?.type === 'share') {
            params.delete(MAIL_OPEN_SHARE_MAILBOX_QUERY_KEY);
            return;
          }
          if (panel === null && activePanel?.type === 'connect') {
            params.delete(MAIL_OPEN_CONNECT_MAILBOX_QUERY_KEY);
            return;
          }
          params.delete(MAIL_OPEN_THREAD_QUERY_KEY);
          params.delete(MAIL_OPEN_SHARE_MAILBOX_QUERY_KEY);
          params.delete(MAIL_OPEN_CONNECT_MAILBOX_QUERY_KEY);
        },
        panel?.type === 'thread' || panel?.type === 'share' || panel?.type === 'connect'
          ? 'push'
          : 'replace',
      );
    },
    [activePanel, updateMailQuery],
  );

  const handleOverlayPanelChange = useCallback((panel: MailOverlayPanel) => {
    setOverlayPanel(panel);
  }, []);

  const selectAccount = (accountId: string | null) => {
    setThreadPage(1);

    setFilterAccountId(accountId);
    updateMailQuery((params) => {
      if (accountId) {
        params.set(MAIL_ACCOUNT_QUERY_KEY, accountId);
      } else {
        params.delete(MAIL_ACCOUNT_QUERY_KEY);
      }
      params.delete(MAIL_OPEN_THREAD_QUERY_KEY);
      params.delete(MAIL_OPEN_SHARE_MAILBOX_QUERY_KEY);
      params.delete(MAIL_OPEN_CONNECT_MAILBOX_QUERY_KEY);
    });
  };

  const selectFolder = (folder: MailFolderKey) => {
    setThreadPage(1);

    setActiveFolder(folder);
  };

  const openThread = (threadId: string) => {
    handleActivePanelChange({ type: 'thread', threadId });
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
      const result = await mailApi.bulkMarkThreadsRead(targets.map((thread) => thread.id));
      const succeededSet = new Set(result.succeededThreadIds);
      const succeededTargets = targets.filter((thread) => succeededSet.has(thread.id));
      succeededTargets.forEach((thread) => {
        handleThreadMarkedRead(thread.id, thread.mailAccountId);
      });
      if (result.failed === 0) {
        clearThreadSelection(setSelectedThreadIds);
        toast.success(
          `Marked ${result.succeeded} thread${result.succeeded === 1 ? '' : 's'} as read.`,
        );
        return;
      }
      if (result.succeeded === 0) {
        toast.error('Could not mark selected threads as read.');
        return;
      }
      setSelectedThreadIds((prev) => {
        const next = new Set(prev);
        result.succeededThreadIds.forEach((threadId) => next.delete(threadId));
        return next;
      });
      toast.error(
        `Marked ${result.succeeded} of ${result.total} thread${result.total === 1 ? '' : 's'} as read. ${result.failed} failed.`,
      );
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
      const result = await mailApi.bulkMarkThreadsUnread(targets.map((thread) => thread.id));
      const succeededSet = new Set(result.succeededThreadIds);
      const succeededTargets = targets.filter((thread) => succeededSet.has(thread.id));
      succeededTargets.forEach((thread) => {
        handleThreadMarkedUnread(thread.id, thread.mailAccountId);
      });
      if (result.failed === 0) {
        clearThreadSelection(setSelectedThreadIds);
        toast.success(
          `Marked ${result.succeeded} thread${result.succeeded === 1 ? '' : 's'} as unread.`,
        );
        return;
      }
      if (result.succeeded === 0) {
        toast.error('Could not mark selected threads as unread.');
        return;
      }
      setSelectedThreadIds((prev) => {
        const next = new Set(prev);
        result.succeededThreadIds.forEach((threadId) => next.delete(threadId));
        return next;
      });
      toast.error(
        `Marked ${result.succeeded} of ${result.total} thread${result.total === 1 ? '' : 's'} as unread. ${result.failed} failed.`,
      );
    } catch (bulkError) {
      toast.error(getApiErrorMessage(bulkError, 'Bulk mark unread failed.'));
    } finally {
      setBulkBusy(false);
    }
  };

  useEffect(() => {
    if (oauthHandled) {
      return;
    }
    const isGmailCallback = oauthConnected === 'gmail';
    if (!isGmailCallback) {
      return;
    }
    if (oauthStatus === 'error') {
      const messageByReason: Record<string, string> = {
        missing_code: 'Google OAuth did not return an authorization code.',
        access_denied: 'Google access was denied. Mailbox was not connected.',
        invalid_state: 'OAuth session expired or is invalid. Please try again.',
        token_exchange_failed: 'Google OAuth token exchange failed. Please try again.',
        missing_refresh_token:
          'Google did not return a refresh token. Please reconnect with consent.',
        insufficient_scope:
          'Google OAuth scopes are insufficient. Reconnect and grant required access.',
        unknown: 'Gmail OAuth failed. Please try again.',
      };
      toast.error(messageByReason[oauthReason ?? 'unknown'] ?? messageByReason.unknown);
      setOauthHandled(true);
      clearOauthOnlyParams();
      return;
    }
    if (oauthAccountId) {
      if (loading) {
        return;
      }
      const connectedAccount = accountHealth.find((account) => account.id === oauthAccountId);
      if (connectedAccount) {
        setFilterAccountId(connectedAccount.id);
        setActivePanel(null);
        toast.success('Gmail mailbox connected.');
      } else {
        toast.success('Gmail mailbox connected.');
      }
      setOauthHandled(true);
      clearOauthOnlyParams();
      return;
    }
    toast.success('Gmail mailbox connected.');
    setOauthHandled(true);
    clearOauthOnlyParams();
  }, [
    oauthHandled,
    oauthConnected,
    oauthStatus,
    oauthReason,
    oauthAccountId,
    accountHealth,
    loading,
    clearOauthOnlyParams,
  ]);

  useEffect(() => {
    if (!canView || loading) {
      return;
    }
    if (queryAccountId === null) {
      if (filterAccountId !== null) {
        setThreadPage(1);
        setFilterAccountId(null);
      }
      return;
    }
    const hasAccount = accountHealth.some((account) => account.id === queryAccountId);
    if (!hasAccount) {
      updateMailQuery((params) => {
        params.delete(MAIL_ACCOUNT_QUERY_KEY);
        params.delete(MAIL_OPEN_THREAD_QUERY_KEY);
        params.delete(MAIL_OPEN_SHARE_MAILBOX_QUERY_KEY);
        params.delete(MAIL_OPEN_CONNECT_MAILBOX_QUERY_KEY);
      });
      if (filterAccountId !== null) {
        setThreadPage(1);
        setFilterAccountId(null);
      }
      if (activePanel?.type === 'thread') {
        setActivePanel(null);
      }
      setOverlayPanel(null);
      return;
    }
    if (filterAccountId !== queryAccountId) {
      setThreadPage(1);
      setFilterAccountId(queryAccountId);
    }
  }, [
    canView,
    loading,
    queryAccountId,
    accountHealth,
    filterAccountId,
    updateMailQuery,
    activePanel,
  ]);

  useEffect(() => {
    if (!canView || loading) {
      return;
    }
    if (!queryOpenThreadId) {
      if (activePanel?.type === 'thread') {
        setActivePanel(null);
      }
      return;
    }
    if (activePanel?.type === 'thread' && activePanel.threadId === queryOpenThreadId) {
      return;
    }
    const inVisibleList = threads.some((thread) => thread.id === queryOpenThreadId);
    if (inVisibleList) {
      setActivePanel({ type: 'thread', threadId: queryOpenThreadId });
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const detail = await mailApi.getThread(queryOpenThreadId);
        if (cancelled) {
          return;
        }
        setActivePanel({ type: 'thread', threadId: queryOpenThreadId });
        const detailAccountId = detail.mailAccount.id;
        if (detailAccountId !== queryAccountId) {
          setThreadPage(1);
          setFilterAccountId(detailAccountId);
          updateMailQuery((params) => {
            params.set(MAIL_ACCOUNT_QUERY_KEY, detailAccountId);
            params.set(MAIL_OPEN_THREAD_QUERY_KEY, queryOpenThreadId);
          });
        }
      } catch {
        if (cancelled) {
          return;
        }
        if (activePanel?.type === 'thread' && activePanel.threadId === queryOpenThreadId) {
          setActivePanel(null);
        }
        setOverlayPanel(null);
        updateMailQuery((params) => {
          params.delete(MAIL_OPEN_THREAD_QUERY_KEY);
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canView, loading, queryOpenThreadId, activePanel, threads, queryAccountId, updateMailQuery]);

  useEffect(() => {
    if (!canView || loading) {
      return;
    }
    const shouldOpenConnect = queryOpenConnectMailbox === '1';
    if (!shouldOpenConnect) {
      if (queryOpenConnectMailbox !== null) {
        updateMailQuery((params) => {
          params.delete(MAIL_OPEN_CONNECT_MAILBOX_QUERY_KEY);
        });
      }
      if (activePanel?.type === 'connect') {
        setActivePanel(null);
      }
      return;
    }
    if (activePanel?.type === 'connect') {
      return;
    }
    setOverlayPanel(null);
    setActivePanel({ type: 'connect' });
  }, [canView, loading, queryOpenConnectMailbox, activePanel, updateMailQuery]);

  useEffect(() => {
    if (!canView || loading) {
      return;
    }
    if (!queryOpenShareMailboxId) {
      if (activePanel?.type === 'share') {
        setActivePanel(null);
      }
      return;
    }
    const shareAccount = accountHealth.find((account) => account.id === queryOpenShareMailboxId);
    if (!shareAccount) {
      updateMailQuery((params) => {
        params.delete(MAIL_OPEN_SHARE_MAILBOX_QUERY_KEY);
      });
      if (activePanel?.type === 'share') {
        setActivePanel(null);
      }
      return;
    }
    if (filterAccountId !== shareAccount.id) {
      setThreadPage(1);
      setFilterAccountId(shareAccount.id);
      updateMailQuery((params) => {
        params.set(MAIL_ACCOUNT_QUERY_KEY, shareAccount.id);
      });
    }
    if (activePanel?.type === 'share' && activePanel.accountId === shareAccount.id) {
      return;
    }
    setOverlayPanel(null);
    setActivePanel({
      type: 'share',
      accountId: shareAccount.id,
      accountEmail: shareAccount.emailAddress,
    });
  }, [
    canView,
    loading,
    queryOpenShareMailboxId,
    accountHealth,
    activePanel,
    filterAccountId,
    updateMailQuery,
  ]);

  useEffect(() => {
    if (
      overlayPanel?.type === 'forward-compose' &&
      (activePanel?.type !== 'thread' || overlayPanel.threadId !== activePanel.threadId)
    ) {
      setOverlayPanel(null);
    }
  }, [activePanel, overlayPanel]);

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
          handleActivePanelChange({
            type: 'share',

            accountId: account.id,

            accountEmail: account.emailAddress,
          })
        }
        onDeleteAccount={(account) =>
          setDeleteMailboxTarget({ id: account.id, emailAddress: account.emailAddress })
        }
        onConnectMailbox={() => handleActivePanelChange({ type: 'connect' })}
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
        onActivePanelChange={handleActivePanelChange}
        overlayPanel={overlayPanel}
        onOverlayPanelChange={handleOverlayPanelChange}
        accounts={accountHealth}
        canEdit={canEdit}
        onThreadMarkedRead={handleThreadMarkedRead}
        onThreadMarkedUnread={handleThreadMarkedUnread}
        onThreadMarkedSpam={(threadId) => {
          handleActivePanelChange(null);
          setThreads((prev) => prev.filter((thread) => thread.id !== threadId));
          clearThreadSelection(setSelectedThreadIds);
        }}
        onMailboxConnected={() => void load()}
        onComposeSent={(threadId) => {
          handleActivePanelChange({ type: 'thread', threadId });
          void load();
        }}
        onThreadDeleted={(threadId) => {
          handleActivePanelChange(null);
          setThreads((prev) => prev.filter((thread) => thread.id !== threadId));
          clearThreadSelection(setSelectedThreadIds);
          toast.success('Email deleted.');
        }}
      />

      <DeleteConfirmDialog
        level="simple"
        open={deleteMailboxTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteMailboxTarget(null);
          }
        }}
        itemName={deleteMailboxTarget?.emailAddress ?? ''}
        title="Delete mailbox?"
        description="NBOS will stop syncing and sending from this mailbox. Existing emails will stay in NBOS. Provider credentials will be removed."
        confirmLabel="Delete mailbox"
        isSubmitting={disconnectingMailbox}
        onConfirm={() => void runDisconnectMailbox()}
      />
    </div>
  );
}
