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
import { SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { mailApi, type MailAccountRow } from '@/lib/api/mail';
import { getApiErrorMessage } from '@/lib/api-errors';
import { MailComposeMessageEditor } from './MailComposeMessageEditor';
import { splitEmailList } from './mail-thread-helpers';

export interface ComposeMailSheetProps {
  enabled: boolean;
  accounts: MailAccountRow[];
  defaultAccountId?: string | null;
  mode?: 'new' | 'forward';
  defaultSubject?: string;
  onSent: (threadId: string) => void;
  onClose: () => void;
}

export function ComposeMailSheet({
  enabled,
  accounts,
  defaultAccountId,
  mode = 'new',
  defaultSubject = '',
  onSent,
  onClose,
}: ComposeMailSheetProps) {
  const [mailAccountId, setMailAccountId] = useState('');
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState<string | null>(null);
  const [bodyText, setBodyText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    setMailAccountId(defaultAccountId ?? accounts[0]?.id ?? '');
    setTo('');
    setCc('');
    setSubject(defaultSubject);
    setBodyHtml(null);
    setBodyText('');
  }, [enabled, defaultAccountId, defaultSubject, accounts, mode]);

  const send = async () => {
    const toList = splitEmailList(to);
    if (!mailAccountId || toList.length === 0 || subject.trim() === '') {
      toast.error('Choose a mailbox and fill in recipient and subject.');
      return;
    }
    setSending(true);
    try {
      const detail = await mailApi.compose({
        mailAccountId,
        to: toList,
        cc: splitEmailList(cc),
        subject: subject.trim(),
        bodyText,
        ...(bodyHtml ? { bodyHtml } : {}),
      });
      toast.success('Email sent.');
      onSent(detail.thread.id);
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Email could not be sent.'));
    } finally {
      setSending(false);
    }
  };

  const isForward = mode === 'forward';

  return (
    <div className="flex h-full min-h-0 flex-col">
      <SheetHeader className="border-border shrink-0 border-b px-5 py-4">
        <SheetTitle>{isForward ? 'Forward email' : 'New email'}</SheetTitle>
        <SheetDescription>
          {isForward
            ? 'Forward this message from a connected mailbox.'
            : 'Compose and send from a connected mailbox.'}
        </SheetDescription>
      </SheetHeader>

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
              {accounts.map((account) => (
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
            disabled={sending}
            onChange={({ bodyHtml: html, bodyText: text }) => {
              setBodyHtml(html);
              setBodyText(text);
            }}
          />
        </div>
      </div>

      <div className="border-border flex shrink-0 justify-end gap-2 border-t px-5 py-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={sending}>
          Cancel
        </Button>
        <Button type="button" onClick={() => void send()} disabled={sending}>
          {sending ? 'Sending…' : 'Send'}
        </Button>
      </div>
    </div>
  );
}
