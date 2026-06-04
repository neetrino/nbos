'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { mailApi, type MailMessageRow, type MailThreadDetailDto } from '@/lib/api/mail';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  defaultReplySubjectFromMessages,
  defaultReplyToFromMessages,
  splitEmailList,
} from './mail-thread-helpers';

export interface MailThreadReplyComposerProps {
  threadId: string;
  messages: MailMessageRow[];
  onThreadUpdated: (detail: MailThreadDetailDto) => void;
}

export function MailThreadReplyComposer({
  threadId,
  messages,
  onThreadUpdated,
}: MailThreadReplyComposerProps) {
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const defaultsKey = useRef<string>('');

  useEffect(() => {
    const key = `${threadId}:${messages.map((m) => m.id).join(',')}`;
    if (defaultsKey.current === key) {
      return;
    }
    defaultsKey.current = key;
    setTo(defaultReplyToFromMessages(messages));
    setCc('');
    setSubject(defaultReplySubjectFromMessages(messages));
    setBody('');
  }, [threadId, messages]);

  const send = useCallback(async () => {
    const toList = splitEmailList(to);
    if (toList.length === 0) {
      toast.error('Enter at least one To address.');
      return;
    }
    setSending(true);
    try {
      const ccList = splitEmailList(cc);
      const d = await mailApi.reply(threadId, {
        to: toList,
        ...(ccList.length > 0 ? { cc: ccList } : {}),
        subject: subject.trim() || undefined,
        bodyText: body,
      });
      onThreadUpdated(d);
      setBody('');
      toast.success('Reply sent.');
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Reply could not be sent.'));
    } finally {
      setSending(false);
    }
  }, [threadId, to, cc, subject, body, onThreadUpdated]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Reply</CardTitle>
        <p className="text-muted-foreground text-xs">
          Sends through the connected mailbox provider.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="mail-reply-to" className="text-muted-foreground text-xs font-medium">
            To (comma-separated)
          </label>
          <Input
            id="mail-reply-to"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="mail-reply-cc" className="text-muted-foreground text-xs font-medium">
            Cc (optional)
          </label>
          <Input
            id="mail-reply-cc"
            value={cc}
            onChange={(e) => setCc(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="mail-reply-subject" className="text-muted-foreground text-xs font-medium">
            Subject
          </label>
          <Input
            id="mail-reply-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="mail-reply-body" className="text-muted-foreground text-xs font-medium">
            Body
          </label>
          <Textarea
            id="mail-reply-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            className="min-h-24 resize-y"
          />
        </div>
        <Button type="button" disabled={sending} onClick={() => void send()}>
          {sending ? 'Sending…' : 'Send reply'}
        </Button>
      </CardContent>
    </Card>
  );
}
