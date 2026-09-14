'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DETAIL_SHEET_FORM_ACTION_BUTTON_SIZE } from '@/components/shared/detail-sheet-classes';
import type { MailAccountRow } from '@/lib/api/mail';
import { MailComposeMessageEditor } from './MailComposeMessageEditor';
import { MailComposeIdentityFields, MailOutlinedMessageField } from './MailComposeFormFields';
import { MailSheetPanelHeader } from './MailSheetPanelHeader';
import { isMailAccountSendable, preferredSendableAccountId } from './mail-sendable-account';
import { useMailComposeDraft } from './use-mail-compose-draft';
import { useMailComposeResume } from './use-mail-compose-resume';
import { MAIL_SHEET_BODY_CLASS, MAIL_SHEET_FOOTER_CLASS } from './mail-ui-classes';

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

  useMailComposeResume({
    enabled,
    resumeThreadId,
    hydrate,
    onHydrated: (draft) => {
      setMailAccountId(draft.mailAccountId);
      setTo(draft.to);
      setCc(draft.cc);
      setSubject(draft.subject);
      setBodyHtml(draft.bodyHtml);
      setBodyText(draft.bodyText);
    },
    onSettled: () => setResumeReady(true),
  });

  const isForward = mode === 'forward';
  const draftLabel =
    status === 'saving' ? 'Saving draft…' : status === 'saved' ? 'Draft saved' : null;
  const fromOptions = accounts
    .filter((account) => isMailAccountSendable(account.status))
    .map((account) => ({ value: account.id, label: account.emailAddress }));

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

      <div className={MAIL_SHEET_BODY_CLASS}>
        <MailComposeIdentityFields
          from={{ value: mailAccountId, options: fromOptions, onChange: setMailAccountId }}
          to={to}
          cc={cc}
          subject={subject}
          onToChange={setTo}
          onCcChange={setCc}
          onSubjectChange={setSubject}
          disabled={busy}
        />
        <MailOutlinedMessageField>
          <MailComposeMessageEditor
            id="compose-body"
            value={bodyHtml}
            disabled={busy}
            fillHeight
            onChange={({ bodyHtml: html, bodyText: text }) => {
              setBodyHtml(html);
              setBodyText(text);
            }}
          />
        </MailOutlinedMessageField>
      </div>

      <ComposeMailSheetFooter
        draftLabel={draftLabel}
        busy={busy}
        onDiscard={() => void discard(onClose)}
        onClose={onClose}
        onSend={() => void send()}
      />
    </div>
  );
}

function ComposeMailSheetFooter({
  draftLabel,
  busy,
  onDiscard,
  onClose,
  onSend,
}: {
  draftLabel: string | null;
  busy: boolean;
  onDiscard: () => void;
  onClose: () => void;
  onSend: () => void;
}) {
  return (
    <div className={MAIL_SHEET_FOOTER_CLASS}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground min-w-0 truncate text-xs">{draftLabel}</p>
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size={DETAIL_SHEET_FORM_ACTION_BUTTON_SIZE}
            onClick={onDiscard}
            disabled={busy}
          >
            Discard
          </Button>
          <Button
            type="button"
            variant="ghost"
            size={DETAIL_SHEET_FORM_ACTION_BUTTON_SIZE}
            onClick={onClose}
            disabled={busy}
          >
            Close
          </Button>
          <Button
            type="button"
            size={DETAIL_SHEET_FORM_ACTION_BUTTON_SIZE}
            onClick={onSend}
            disabled={busy}
          >
            <Send size={16} aria-hidden />
            {busy ? 'Sending…' : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  );
}
