'use client';

import { useState } from 'react';
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
import { mailApi, type MailSecureMode } from '@/lib/api/mail';
import { getApiErrorMessage } from '@/lib/api-errors';

interface CorporateMailboxFormProps {
  onCancel: () => void;
  onConnected: () => void;
}

const SECURE_MODES: MailSecureMode[] = ['SSL', 'STARTTLS', 'NONE'];

interface FormState {
  email: string;
  imapHost: string;
  imapPort: string;
  imapSecure: MailSecureMode;
  smtpHost: string;
  smtpPort: string;
  smtpSecure: MailSecureMode;
  login: string;
  password: string;
}

const INITIAL_STATE: FormState = {
  email: '',
  imapHost: '',
  imapPort: '993',
  imapSecure: 'SSL',
  smtpHost: '',
  smtpPort: '465',
  smtpSecure: 'SSL',
  login: '',
  password: '',
};

function isComplete(state: FormState): boolean {
  return Boolean(
    state.email &&
    state.imapHost &&
    state.imapPort &&
    state.smtpHost &&
    state.smtpPort &&
    state.login &&
    state.password,
  );
}

export function CorporateMailboxForm({ onCancel, onConnected }: CorporateMailboxFormProps) {
  const [state, setState] = useState<FormState>(INITIAL_STATE);
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((prev) => ({ ...prev, [key]: value }));

  const submit = async () => {
    if (!isComplete(state)) {
      toast.error('Please fill in all fields.');
      return;
    }
    setSubmitting(true);
    try {
      await mailApi.connectCorporate({
        email: state.email.trim(),
        imapHost: state.imapHost.trim(),
        imapPort: Number(state.imapPort),
        imapSecure: state.imapSecure,
        smtpHost: state.smtpHost.trim(),
        smtpPort: Number(state.smtpPort),
        smtpSecure: state.smtpSecure,
        login: state.login.trim(),
        password: state.password,
      });
      toast.success('Mailbox connected.');
      onConnected();
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Mailbox validation failed. Check the settings.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-2">
        <Label htmlFor="mb-email">Email</Label>
        <Input
          id="mb-email"
          type="email"
          value={state.email}
          onChange={(e) => set('email', e.target.value)}
          placeholder="user@company.com"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="mb-imap-host">IMAP host</Label>
          <Input
            id="mb-imap-host"
            value={state.imapHost}
            onChange={(e) => set('imapHost', e.target.value)}
            placeholder="imap.company.com"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="mb-imap-port">IMAP port</Label>
          <Input
            id="mb-imap-port"
            inputMode="numeric"
            value={state.imapPort}
            onChange={(e) => set('imapPort', e.target.value)}
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label>IMAP secure mode</Label>
        <Select
          value={state.imapSecure}
          onValueChange={(v) => set('imapSecure', v as MailSecureMode)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SECURE_MODES.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="mb-smtp-host">SMTP host</Label>
          <Input
            id="mb-smtp-host"
            value={state.smtpHost}
            onChange={(e) => set('smtpHost', e.target.value)}
            placeholder="smtp.company.com"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="mb-smtp-port">SMTP port</Label>
          <Input
            id="mb-smtp-port"
            inputMode="numeric"
            value={state.smtpPort}
            onChange={(e) => set('smtpPort', e.target.value)}
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label>SMTP secure mode</Label>
        <Select
          value={state.smtpSecure}
          onValueChange={(v) => set('smtpSecure', v as MailSecureMode)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SECURE_MODES.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="mb-login">Login</Label>
          <Input
            id="mb-login"
            value={state.login}
            onChange={(e) => set('login', e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="mb-password">Password</Label>
          <Input
            id="mb-password"
            type="password"
            value={state.password}
            onChange={(e) => set('password', e.target.value)}
            autoComplete="new-password"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Back
        </Button>
        <Button type="button" onClick={() => void submit()} disabled={submitting}>
          {submitting ? 'Validating…' : 'Connect mailbox'}
        </Button>
      </div>
    </div>
  );
}
