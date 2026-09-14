'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { mailApi, type MailMessageRow, type MailThreadDetailDto } from '@/lib/api/mail';
import { getApiErrorMessage } from '@/lib/api-errors';
import { MAIL_QUEUED_TOAST } from './mail-outbound-copy';
import {
  defaultReplySubjectFromMessages,
  defaultReplyToFromMessages,
  emailsForRecipientKind,
  latestOutboundDraftMessage,
  splitEmailList,
} from './mail-thread-helpers';

export interface MailThreadReplyComposerProps {
  threadId: string;
  messages: MailMessageRow[];
  onThreadUpdated: (detail: MailThreadDetailDto) => void;
  onDismiss?: () => void;
  onSent?: () => void;
}

export function MailThreadReplyComposer({
  threadId,
  messages,
  onThreadUpdated,
  onDismiss,
  onSent,
}: MailThreadReplyComposerProps) {
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const defaultsKey = useRef<string>('');
  const draftIdRef = useRef<string | null>(null);

  useEffect(() => {
    const key = `${threadId}:${messages.map((m) => m.id).join(',')}`;
    if (defaultsKey.current === key) {
      return;
    }
    defaultsKey.current = key;
    const draft = latestOutboundDraftMessage(messages);
    if (draft) {
      draftIdRef.current = draft.id;
      setTo(emailsForRecipientKind(draft, 'TO'));
      setCc(emailsForRecipientKind(draft, 'CC'));
      setSubject(draft.subject);
      setBody(draft.bodyText ?? '');
      return;
    }
    draftIdRef.current = null;
    setTo(defaultReplyToFromMessages(messages));
    setCc('');
    setSubject(defaultReplySubjectFromMessages(messages));
    setBody('');
  }, [threadId, messages]);

  const persistDraft = useCallback(async (): Promise<string | null> => {
    const toList = splitEmailList(to);
    const ccList = splitEmailList(cc);
    const payload = {
      to: toList,
      ...(ccList.length > 0 ? { cc: ccList } : {}),
      subject: subject.trim(),
      bodyText: body,
    };
    const draftId = draftIdRef.current;
    const detail = draftId
      ? await mailApi.updateOutboundDraft(threadId, draftId, payload)
      : await mailApi.createOutboundDraft(threadId, payload);
    const saved = latestOutboundDraftMessage(detail.messages);
    if (saved) {
      draftIdRef.current = saved.id;
    }
    onThreadUpdated(detail);
    return saved?.id ?? draftId;
  }, [body, cc, onThreadUpdated, subject, threadId, to]);

  const send = useCallback(async () => {
    const toList = splitEmailList(to);
    if (toList.length === 0) {
      toast.error('Enter at least one To address.');
      return;
    }
    if (subject.trim() === '') {
      toast.error('Add a subject before sending.');
      return;
    }
    setSending(true);
    try {
      const draftId = await persistDraft();
      if (!draftId) {
        return;
      }
      const d = await mailApi.queueOutboundDraft(threadId, draftId);
      onThreadUpdated(d);
      setBody('');
      draftIdRef.current = null;
      toast.success(MAIL_QUEUED_TOAST);
      onSent?.();
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Reply could not be sent.'));
    } finally {
      setSending(false);
    }
  }, [onSent, onThreadUpdated, persistDraft, subject, threadId, to]);

  const saveDraft = useCallback(async () => {
    setSending(true);
    try {
      await persistDraft();
      toast.success('Draft saved.');
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Draft could not be saved.'));
    } finally {
      setSending(false);
    }
  }, [persistDraft]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Reply</CardTitle>
        <p className="text-muted-foreground text-xs">
          Saved as a draft until you send. Sends through the connected mailbox.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="mail-reply-to">To (comma-separated)</Label>
          <Input
            id="mail-reply-to"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="mail-reply-cc">Cc (optional)</Label>
          <Input
            id="mail-reply-cc"
            value={cc}
            onChange={(e) => setCc(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="mail-reply-subject">Subject</Label>
          <Input
            id="mail-reply-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="mail-reply-body">Body</Label>
          <Textarea
            id="mail-reply-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            className="min-h-24 resize-y"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {onDismiss ? (
            <Button type="button" variant="outline" disabled={sending} onClick={onDismiss}>
              Cancel
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            disabled={sending}
            onClick={() => void saveDraft()}
          >
            Save draft
          </Button>
          <Button type="button" disabled={sending} onClick={() => void send()}>
            {sending ? 'Sending…' : 'Send reply'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
