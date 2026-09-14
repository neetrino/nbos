'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mailApi, type MailAccountRow } from '@/lib/api/mail';
import { getApiErrorMessage } from '@/lib/api-errors';
import { MailComposeMessageEditor } from './MailComposeMessageEditor';
import { MailSheetPanelHeader } from './MailSheetPanelHeader';
import { isMailAccountSendable, preferredSendableAccountId } from './mail-sendable-account';
import { useMailComposeDraft } from './use-mail-compose-draft';
import { emailsForRecipientKind, latestOutboundDraftMessage } from './mail-thread-helpers';

export interface ComposeMailSheetProps {
  enabled: boolean;
  accounts: MailAccountRow[];
  defaultAccountId?: string | null;
  mode?: 'new' | 'forward';
  defaultSubject?: string;
  resumeThreadId?: string | null;
  onSent: (threadId: string) => void;
  onClose: () => void;
}

export function ComposeMailSheet({
  enabled,
  accounts,
  defaultAccountId,
  mode = 'new',
  defaultSubject = '',
  resumeThreadId = null,
  onSent,
  onClose,
}: ComposeMailSheetProps) {
  const [mailAccountId, setMailAccountId] = useState(() =>
    preferredSendableAccountId(accounts, defaultAccountId),
  );
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [subject, setSubject] = useState(defaultSubject);
  const [bodyHtml, setBodyHtml] = useState<string | null>(null);
  const [bodyText, setBodyText] = useState('');
  const [resumeReady, setResumeReady] = useState(!resumeThreadId);

  const { status, busy, hydrate, send, discard } = useMailComposeDraft({
    enabled: enabled && resumeReady,
    mailAccountId,
    to,
    cc,
    subject,
    bodyText,
    bodyHtml,
    onSent,
  });

  useEffect(() => {
    if (!enabled || !resumeThreadId) {
      return;
    }
    let cancelled = false;
    void mailApi
      .getThread(resumeThreadId)
      .then((detail) => {
        if (cancelled) {
          return;
        }
        const draft = latestOutboundDraftMessage(detail.messages);
        if (!draft) {
          setResumeReady(true);
          return;
        }
        setMailAccountId(detail.thread.mailAccountId);
        setTo(emailsForRecipientKind(draft, 'TO'));
        setCc(emailsForRecipientKind(draft, 'CC'));
        setSubject(draft.subject);
        setBodyHtml(draft.bodyHtmlSanitized);
        setBodyText(draft.bodyText ?? '');
        hydrate(detail.thread.id, draft.id);
        setResumeReady(true);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          toast.error(getApiErrorMessage(error, 'Draft could not be opened.'));
          setResumeReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, hydrate, resumeThreadId]);

  const isForward = mode === 'forward';
  const draftLabel =
    status === 'saving' ? 'Saving draft…' : status === 'saved' ? 'Draft saved' : null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <MailSheetPanelHeader
        title={isForward ? 'Forward email' : resumeThreadId ? 'Draft' : 'New email'}
        description={
          isForward
            ? 'Forward this message from a connected mailbox.'
            : 'Saved as a draft until you send. Close keeps the draft.'
        }
      />

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 py-4">
        <div className="grid gap-2">
          <Label>From</Label>
          <Select value={mailAccountId} onValueChange={(v) => setMailAccountId(v ?? '')}>
            <SelectTrigger>
              <SelectValue placeholder="Select a mailbox">
                {(selected: string | null) =>
                  selected
                    ? (accounts.find((account) => account.id === selected)?.emailAddress ??
                      'Mailbox')
                    : null
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {accounts
                .filter((account) => isMailAccountSendable(account.status))
                .map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.emailAddress}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="compose-to">To</Label>
          <Input
            id="compose-to"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            placeholder="recipient@example.com, second@example.com"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="compose-cc">Cc (optional)</Label>
          <Input id="compose-cc" value={cc} onChange={(event) => setCc(event.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="compose-subject">Subject</Label>
          <Input
            id="compose-subject"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="compose-body">Message</Label>
          <MailComposeMessageEditor
            id="compose-body"
            value={bodyHtml}
            disabled={busy}
            onChange={({ bodyHtml: html, bodyText: text }) => {
              setBodyHtml(html);
              setBodyText(text);
            }}
          />
        </div>
      </div>

      <div className="border-border flex shrink-0 items-center justify-between gap-2 border-t px-5 py-4">
        <p className="text-muted-foreground text-xs">{draftLabel}</p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void discard(onClose)}
            disabled={busy}
          >
            Discard
          </Button>
          <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
            Close
          </Button>
          <Button type="button" onClick={() => void send()} disabled={busy}>
            {busy ? 'Sending…' : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  );
}
