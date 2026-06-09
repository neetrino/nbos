'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { mailApi, type MailThreadDetailDto } from '@/lib/api/mail';
import { getApiErrorMessage } from '@/lib/api-errors';

export interface UseMailThreadDetailOptions {
  threadId: string;
  enabled?: boolean;
  /** When true (default), marks unread threads read after detail loads. */
  autoMarkRead?: boolean;
  onThreadMarkedRead?: (threadId: string, mailAccountId: string) => void;
  onThreadMarkedUnread?: (threadId: string, mailAccountId: string) => void;
  onThreadMarkedSpam?: (threadId: string, mailAccountId: string) => void;
}

export function useMailThreadDetail({
  threadId,
  enabled = true,
  autoMarkRead = true,
  onThreadMarkedRead,
  onThreadMarkedUnread,
  onThreadMarkedSpam,
}: UseMailThreadDetailOptions) {
  const [detail, setDetail] = useState<MailThreadDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [markingRead, setMarkingRead] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queueingMessageId, setQueueingMessageId] = useState<string | null>(null);
  const [finalizingMessageId, setFinalizingMessageId] = useState<string | null>(null);
  const [cancellingMessageId, setCancellingMessageId] = useState<string | null>(null);
  const [retryingFailedMessageId, setRetryingFailedMessageId] = useState<string | null>(null);
  const [patchingNeedsLink, setPatchingNeedsLink] = useState(false);
  const [markingUnread, setMarkingUnread] = useState(false);
  const [markingSpam, setMarkingSpam] = useState(false);
  const autoMarkAttemptedRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    if (!threadId) return;
    setLoading(true);
    setError(null);
    try {
      const d = await mailApi.getThread(threadId);
      setDetail(d);
    } catch (e) {
      setDetail(null);
      setError(getApiErrorMessage(e, 'Thread could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  const markRead = useCallback(async () => {
    if (!threadId || !detail?.thread.hasUnread) return;
    setMarkingRead(true);
    setError(null);
    try {
      const d = await mailApi.markThreadRead(threadId);
      setDetail(d);
      onThreadMarkedRead?.(threadId, d.thread.mailAccountId);
    } catch (e) {
      setError(getApiErrorMessage(e, 'Could not mark thread as read.'));
    } finally {
      setMarkingRead(false);
    }
  }, [threadId, detail?.thread.hasUnread, onThreadMarkedRead]);

  const markUnread = useCallback(async () => {
    if (!threadId || detail?.thread.hasUnread) return;
    setMarkingUnread(true);
    setError(null);
    try {
      const d = await mailApi.markThreadUnread(threadId);
      setDetail(d);
      onThreadMarkedUnread?.(threadId, d.thread.mailAccountId);
      toast.success('Marked as unread.');
    } catch (e) {
      setError(getApiErrorMessage(e, 'Could not mark thread as unread.'));
    } finally {
      setMarkingUnread(false);
    }
  }, [threadId, detail?.thread.hasUnread, onThreadMarkedUnread]);

  const markSpam = useCallback(async () => {
    if (!threadId || detail?.thread.isSpam) return;
    setMarkingSpam(true);
    setError(null);
    try {
      const d = await mailApi.markThreadSpam(threadId);
      setDetail(d);
      onThreadMarkedSpam?.(threadId, d.thread.mailAccountId);
      toast.success('Moved to spam.');
    } catch (e) {
      setError(getApiErrorMessage(e, 'Could not mark thread as spam.'));
    } finally {
      setMarkingSpam(false);
    }
  }, [threadId, detail?.thread.isSpam, onThreadMarkedSpam]);

  const queueDraftForSend = useCallback(
    async (messageId: string) => {
      if (!threadId) return;
      setQueueingMessageId(messageId);
      setError(null);
      try {
        const d = await mailApi.queueOutboundDraft(threadId, messageId);
        setDetail(d);
      } catch (e) {
        setError(getApiErrorMessage(e, 'Could not queue message.'));
      } finally {
        setQueueingMessageId(null);
      }
    },
    [threadId],
  );

  const finalizeQueuedStub = useCallback(
    async (messageId: string) => {
      if (!threadId) return;
      setFinalizingMessageId(messageId);
      setError(null);
      try {
        const d = await mailApi.finalizeQueuedOutboundStub(threadId, messageId);
        setDetail(d);
      } catch (e) {
        setError(getApiErrorMessage(e, 'Could not finalize send (stub).'));
      } finally {
        setFinalizingMessageId(null);
      }
    },
    [threadId],
  );

  const cancelOutbound = useCallback(
    async (messageId: string) => {
      if (!threadId) return;
      setCancellingMessageId(messageId);
      setError(null);
      try {
        const d = await mailApi.cancelOutboundDraftOrQueued(threadId, messageId);
        setDetail(d);
      } catch (e) {
        setError(getApiErrorMessage(e, 'Could not cancel message.'));
      } finally {
        setCancellingMessageId(null);
      }
    },
    [threadId],
  );

  const resetFailedToDraft = useCallback(
    async (messageId: string) => {
      if (!threadId) return;
      setRetryingFailedMessageId(messageId);
      setError(null);
      try {
        const d = await mailApi.resetFailedOutboundToDraft(threadId, messageId);
        setDetail(d);
      } catch (e) {
        setError(getApiErrorMessage(e, 'Could not reset message to draft.'));
      } finally {
        setRetryingFailedMessageId(null);
      }
    },
    [threadId],
  );

  const setNeedsBusinessLink = useCallback(
    async (needsBusinessLink: boolean) => {
      if (!threadId) return;
      setPatchingNeedsLink(true);
      setError(null);
      try {
        const d = await mailApi.patchThread(threadId, { needsBusinessLink });
        setDetail(d);
      } catch (e) {
        setError(getApiErrorMessage(e, 'Could not update thread.'));
      } finally {
        setPatchingNeedsLink(false);
      }
    },
    [threadId],
  );

  useEffect(() => {
    autoMarkAttemptedRef.current = null;
  }, [threadId]);

  useEffect(() => {
    if (!enabled || !threadId) {
      setLoading(false);
      setDetail(null);
      setError(null);
      return;
    }
    void load();
  }, [enabled, threadId, load]);

  useEffect(() => {
    if (!autoMarkRead || !enabled || !threadId || loading || !detail?.thread.hasUnread) {
      return;
    }
    if (autoMarkAttemptedRef.current === threadId) {
      return;
    }
    autoMarkAttemptedRef.current = threadId;
    void (async () => {
      try {
        const d = await mailApi.markThreadRead(threadId);
        setDetail(d);
        onThreadMarkedRead?.(threadId, d.thread.mailAccountId);
      } catch (e) {
        autoMarkAttemptedRef.current = null;
        toast.error(getApiErrorMessage(e, 'Could not mark thread as read.'));
      }
    })();
  }, [autoMarkRead, enabled, threadId, loading, detail?.thread.hasUnread, onThreadMarkedRead]);

  return {
    detail,
    setDetail,
    loading,
    error,
    load,
    markingRead,
    markingUnread,
    markingSpam,
    queueingMessageId,
    finalizingMessageId,
    cancellingMessageId,
    retryingFailedMessageId,
    patchingNeedsLink,
    markRead,
    markUnread,
    markSpam,
    queueDraftForSend,
    finalizeQueuedStub,
    cancelOutbound,
    resetFailedToDraft,
    setNeedsBusinessLink,
  };
}
