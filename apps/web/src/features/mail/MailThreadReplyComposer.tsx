'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DETAIL_SHEET_FORM_ACTION_BUTTON_SIZE } from '@/components/shared/detail-sheet-classes';
import { mailApi, type MailMessageRow, type MailThreadDetailDto } from '@/lib/api/mail';
import { getApiErrorMessage } from '@/lib/api-errors';
import { MAIL_QUEUED_TOAST } from './mail-outbound-copy';
import { MailComposeIdentityFields, MailOutlinedMessageField } from './MailComposeFormFields';
import { MailComposeMessageEditor } from './MailComposeMessageEditor';
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
  const [bodyHtml, setBodyHtml] = useState<string | null>(null);
  const [bodyText, setBodyText] = useState('');
  const [sending, setSending] = useState(false);
  const defaultsKey = useRef<string>('');
  const draftIdRef = useRef<string | null>(null);

  useEffect(() => {
    const key = `${threadId}:${messages.map((message) => message.id).join(',')}`;
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
      setBodyHtml(draft.bodyHtmlSanitized);
      setBodyText(draft.bodyText ?? '');
      return;
    }
    draftIdRef.current = null;
    setTo(defaultReplyToFromMessages(messages));
    setCc('');
    setSubject(defaultReplySubjectFromMessages(messages));
    setBodyHtml(null);
    setBodyText('');
  }, [threadId, messages]);

  const persistDraft = useCallback(async (): Promise<string | null> => {
    const toList = splitEmailList(to);
    const ccList = splitEmailList(cc);
    const payload = {
      to: toList,
      ...(ccList.length > 0 ? { cc: ccList } : {}),
      subject: subject.trim(),
      bodyText,
      ...(bodyHtml ? { bodyHtml } : {}),
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
  }, [bodyHtml, bodyText, cc, onThreadUpdated, subject, threadId, to]);

  const send = useCallback(async () => {
    if (splitEmailList(to).length === 0) {
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
      const detail = await mailApi.queueOutboundDraft(threadId, draftId);
      onThreadUpdated(detail);
      setBodyHtml(null);
      setBodyText('');
      draftIdRef.current = null;
      toast.success(MAIL_QUEUED_TOAST);
      onSent?.();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Reply could not be sent.'));
    } finally {
      setSending(false);
    }
  }, [onSent, onThreadUpdated, persistDraft, subject, threadId, to]);

  const saveDraft = useCallback(async () => {
    setSending(true);
    try {
      await persistDraft();
      toast.success('Draft saved.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Draft could not be saved.'));
    } finally {
      setSending(false);
    }
  }, [persistDraft]);

  return (
    <section className="border-border bg-card rounded-2xl border p-4 shadow-sm shadow-black/[0.03]">
      <div className="mb-4">
        <h3 className="text-sm font-semibold">Reply</h3>
        <p className="text-muted-foreground text-xs">
          Saved as a draft until you send. Sends through the connected mailbox.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <MailComposeIdentityFields
          to={to}
          cc={cc}
          subject={subject}
          onToChange={setTo}
          onCcChange={setCc}
          onSubjectChange={setSubject}
          disabled={sending}
        />
        <MailOutlinedMessageField className="min-h-[16rem]">
          <MailComposeMessageEditor
            id="mail-reply-body"
            value={bodyHtml}
            disabled={sending}
            onChange={({ bodyHtml: html, bodyText: text }) => {
              setBodyHtml(html);
              setBodyText(text);
            }}
          />
        </MailOutlinedMessageField>
        <div className="flex flex-wrap justify-end gap-2">
          {onDismiss ? (
            <Button
              type="button"
              variant="outline"
              size={DETAIL_SHEET_FORM_ACTION_BUTTON_SIZE}
              disabled={sending}
              onClick={onDismiss}
            >
              Cancel
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size={DETAIL_SHEET_FORM_ACTION_BUTTON_SIZE}
            disabled={sending}
            onClick={() => void saveDraft()}
          >
            Save draft
          </Button>
          <Button
            type="button"
            size={DETAIL_SHEET_FORM_ACTION_BUTTON_SIZE}
            disabled={sending}
            onClick={() => void send()}
          >
            <Send size={16} aria-hidden />
            {sending ? 'Sending…' : 'Send reply'}
          </Button>
        </div>
      </div>
    </section>
  );
}
