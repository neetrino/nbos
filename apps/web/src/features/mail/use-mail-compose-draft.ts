'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { mailApi, type MailThreadDetailDto } from '@/lib/api/mail';
import { getApiErrorMessage } from '@/lib/api-errors';
import { MAIL_COMPOSE_DRAFT_AUTOSAVE_MS } from './mail-compose-draft.constants';
import { isMailComposeDraftWorthSaving, mailComposeDraftPayload } from './mail-compose-draft';
import { MAIL_DRAFT_DISCARDED_TOAST, MAIL_QUEUED_TOAST } from './mail-outbound-copy';

export type MailComposeDraftStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface MailComposeDraftForm {
  to: string;
  cc: string;
  subject: string;
  bodyText: string;
  bodyHtml: string | null;
}

export function useMailComposeDraft(opts: {
  enabled: boolean;
  mailAccountId: string;
  to: string;
  cc: string;
  subject: string;
  bodyText: string;
  bodyHtml: string | null;
  onSent: (threadId: string) => void;
}) {
  const { enabled, mailAccountId, to, cc, subject, bodyText, bodyHtml, onSent } = opts;
  const threadIdRef = useRef<string | null>(null);
  const messageIdRef = useRef<string | null>(null);
  const saveLockRef = useRef<Promise<{ threadId: string; messageId: string } | null> | null>(null);
  const [status, setStatus] = useState<MailComposeDraftStatus>('idle');
  const [busy, setBusy] = useState(false);

  const hydrate = useCallback((threadId: string, messageId: string) => {
    threadIdRef.current = threadId;
    messageIdRef.current = messageId;
    setStatus('saved');
  }, []);

  const persist = useCallback(async (): Promise<{ threadId: string; messageId: string } | null> => {
    if (saveLockRef.current) {
      return saveLockRef.current;
    }
    const run = persistComposeDraft({
      mailAccountId,
      form: { to, cc, subject, bodyText, bodyHtml },
      threadId: threadIdRef.current,
      messageId: messageIdRef.current,
      setStatus,
      assignIds: (threadId, messageId) => {
        threadIdRef.current = threadId;
        messageIdRef.current = messageId;
      },
    });
    saveLockRef.current = run;
    try {
      return await run;
    } finally {
      saveLockRef.current = null;
    }
  }, [mailAccountId, to, cc, subject, bodyText, bodyHtml]);

  useEffect(() => {
    if (!enabled || !mailAccountId) {
      return;
    }
    const payload = mailComposeDraftPayload({ to, cc, subject, bodyText, bodyHtml });
    if (!isMailComposeDraftWorthSaving(payload)) {
      return;
    }
    const timer = window.setTimeout(() => {
      void persist();
    }, MAIL_COMPOSE_DRAFT_AUTOSAVE_MS);
    return () => window.clearTimeout(timer);
  }, [enabled, mailAccountId, to, cc, subject, bodyText, bodyHtml, persist]);

  const send = useCallback(async () => {
    const payload = mailComposeDraftPayload({ to, cc, subject, bodyText, bodyHtml });
    if ((payload.to?.length ?? 0) === 0 || !(payload.subject ?? '').trim()) {
      toast.error('Choose a mailbox and fill in recipient and subject.');
      return;
    }
    setBusy(true);
    try {
      const ids = await persist();
      if (!ids) {
        return;
      }
      await mailApi.queueOutboundDraft(ids.threadId, ids.messageId);
      toast.success(MAIL_QUEUED_TOAST);
      onSent(ids.threadId);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Email could not be sent.'));
    } finally {
      setBusy(false);
    }
  }, [bodyHtml, bodyText, cc, onSent, persist, subject, to]);

  const discard = useCallback(async (onClose: () => void) => {
    const threadId = threadIdRef.current;
    const messageId = messageIdRef.current;
    if (!threadId || !messageId) {
      onClose();
      return;
    }
    setBusy(true);
    try {
      await mailApi.cancelOutboundDraftOrQueued(threadId, messageId);
      toast.success(MAIL_DRAFT_DISCARDED_TOAST);
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Draft could not be discarded.'));
    } finally {
      setBusy(false);
    }
  }, []);

  const persistRef = useRef(persist);
  persistRef.current = persist;

  useEffect(() => {
    if (!enabled) {
      return;
    }
    return () => {
      void persistRef.current();
    };
  }, [enabled]);

  return { status, busy, hydrate, persist, send, discard };
}

async function persistComposeDraft(params: {
  mailAccountId: string;
  form: MailComposeDraftForm;
  threadId: string | null;
  messageId: string | null;
  setStatus: (status: MailComposeDraftStatus) => void;
  assignIds: (threadId: string, messageId: string) => void;
}): Promise<{ threadId: string; messageId: string } | null> {
  const payload = mailComposeDraftPayload(params.form);
  if (!isMailComposeDraftWorthSaving(payload)) {
    return params.threadId && params.messageId
      ? { threadId: params.threadId, messageId: params.messageId }
      : null;
  }
  if (!params.mailAccountId) {
    toast.error('Choose a mailbox and fill in recipient and subject.');
    return null;
  }
  params.setStatus('saving');
  try {
    const detail = await writeComposeDraft({
      mailAccountId: params.mailAccountId,
      payload,
      threadId: params.threadId,
      messageId: params.messageId,
    });
    const messageId = params.messageId ?? latestDraftId(detail);
    if (!messageId) {
      params.setStatus('error');
      return null;
    }
    params.assignIds(detail.thread.id, messageId);
    params.setStatus('saved');
    return { threadId: detail.thread.id, messageId };
  } catch (error) {
    params.setStatus('error');
    toast.error(getApiErrorMessage(error, 'Draft could not be saved.'));
    return null;
  }
}

async function writeComposeDraft(params: {
  mailAccountId: string;
  payload: ReturnType<typeof mailComposeDraftPayload>;
  threadId: string | null;
  messageId: string | null;
}): Promise<MailThreadDetailDto> {
  if (params.threadId && params.messageId) {
    return mailApi.updateOutboundDraft(params.threadId, params.messageId, params.payload);
  }
  return mailApi.createComposeDraft({ mailAccountId: params.mailAccountId, ...params.payload });
}

function latestDraftId(detail: MailThreadDetailDto): string | null {
  for (let i = detail.messages.length - 1; i >= 0; i -= 1) {
    const message = detail.messages[i];
    if (message?.direction === 'OUTBOUND' && message.deliveryStatus === 'DRAFT') {
      return message.id;
    }
  }
  return null;
}
