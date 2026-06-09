'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { splitEmailList } from './mail-thread-helpers';

interface ComposeMailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: MailAccountRow[];
  defaultAccountId?: string | null;
  onSent: (threadId: string) => void;
}

export function ComposeMailDialog({
  open,
  onOpenChange,
  accounts,
  defaultAccountId,
  onSent,
}: ComposeMailDialogProps) {
  const [mailAccountId, setMailAccountId] = useState(defaultAccountId ?? accounts[0]?.id ?? '');
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState<string | null>(null);
  const [bodyText, setBodyText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    setMailAccountId(defaultAccountId ?? accounts[0]?.id ?? '');
    setTo('');
    setCc('');
    setSubject('');
    setBodyHtml(null);
    setBodyText('');
  }, [open, defaultAccountId, accounts]);

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
      onOpenChange(false);
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Email could not be sent.'));
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New email</DialogTitle>
          <DialogDescription>Compose and send from a connected mailbox.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
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
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.emailAddress}
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
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com, second@example.com"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="compose-cc">Cc (optional)</Label>
            <Input id="compose-cc" value={cc} onChange={(e) => setCc(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="compose-subject">Subject</Label>
            <Input
              id="compose-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
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

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={sending}
          >
            Cancel
          </Button>
          <Button type="button" onClick={() => void send()} disabled={sending}>
            {sending ? 'Sending…' : 'Send'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
