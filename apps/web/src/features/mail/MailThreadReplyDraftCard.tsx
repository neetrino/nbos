'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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

export interface MailThreadReplyDraftCardProps {
  threadId: string;
  messages: MailMessageRow[];
  onThreadUpdated: (detail: MailThreadDetailDto) => void;
}

export function MailThreadReplyDraftCard({
  threadId,
  messages,
  onThreadUpdated,
}: MailThreadReplyDraftCardProps) {
  const [draftTo, setDraftTo] = useState('');
  const [draftCc, setDraftCc] = useState('');
  const [draftSubject, setDraftSubject] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [draftSaving, setDraftSaving] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const draftDefaultsKey = useRef<string>('');

  useEffect(() => {
    const key = `${threadId}:${messages.map((m) => m.id).join(',')}`;
    if (draftDefaultsKey.current === key) {
      return;
    }
    draftDefaultsKey.current = key;
    setDraftTo(defaultReplyToFromMessages(messages));
    setDraftCc('');
    setDraftSubject(defaultReplySubjectFromMessages(messages));
    setDraftBody('');
    setDraftError(null);
  }, [threadId, messages]);

  const saveDraft = useCallback(async () => {
    const to = splitEmailList(draftTo);
    if (to.length === 0) {
      setDraftError('Enter at least one To address.');
      return;
    }
    if (!draftSubject.trim()) {
      setDraftError('Subject is required.');
      return;
    }
    setDraftSaving(true);
    setDraftError(null);
    try {
      const cc = splitEmailList(draftCc);
      const d = await mailApi.createOutboundDraft(threadId, {
        to,
        ...(cc.length > 0 ? { cc } : {}),
        subject: draftSubject.trim(),
        bodyText: draftBody,
      });
      onThreadUpdated(d);
      setDraftBody('');
    } catch (e) {
      setDraftError(getApiErrorMessage(e, 'Draft could not be saved.'));
    } finally {
      setDraftSaving(false);
    }
  }, [threadId, draftTo, draftCc, draftSubject, draftBody, onThreadUpdated]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Reply as draft</CardTitle>
        <p className="text-muted-foreground text-xs">
          Saved locally as DRAFT. No SMTP or provider send in this MVP.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {draftError ? <p className="text-destructive text-sm">{draftError}</p> : null}
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label htmlFor="mail-draft-to" className="text-muted-foreground text-xs font-medium">
              To (comma-separated)
            </label>
            <Input
              id="mail-draft-to"
              value={draftTo}
              onChange={(e) => setDraftTo(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label htmlFor="mail-draft-cc" className="text-muted-foreground text-xs font-medium">
              Cc (optional)
            </label>
            <Input
              id="mail-draft-cc"
              value={draftCc}
              onChange={(e) => setDraftCc(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label
              htmlFor="mail-draft-subject"
              className="text-muted-foreground text-xs font-medium"
            >
              Subject
            </label>
            <Input
              id="mail-draft-subject"
              value={draftSubject}
              onChange={(e) => setDraftSubject(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label htmlFor="mail-draft-body" className="text-muted-foreground text-xs font-medium">
              Body
            </label>
            <Textarea
              id="mail-draft-body"
              value={draftBody}
              onChange={(e) => setDraftBody(e.target.value)}
              rows={5}
              className="min-h-24 resize-y"
            />
          </div>
        </div>
        <Button type="button" disabled={draftSaving} onClick={() => void saveDraft()}>
          {draftSaving ? 'Saving…' : 'Save draft'}
        </Button>
      </CardContent>
    </Card>
  );
}
