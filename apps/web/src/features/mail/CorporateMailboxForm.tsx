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
import {
  CORPORATE_MAILBOX_INITIAL_STATE,
  isCorporateFormComplete,
  MAIL_SECURE_MODES,
  type CorporateMailboxFormState,
} from './corporate-mailbox-form-state';

interface CorporateMailboxFormProps {
  onCancel: () => void;
  onConnected: () => void;
  mode?: 'connect' | 'reconnect';
  accountId?: string;
  initial?: CorporateMailboxFormState;
  hasStoredPassword?: boolean;
  lastError?: string | null;
}

export function CorporateMailboxForm({
  onCancel,
  onConnected,
  mode = 'connect',
  accountId,
  initial,
  hasStoredPassword = false,
  lastError,
}: CorporateMailboxFormProps) {
  const [state, setState] = useState<CorporateMailboxFormState>(
    initial ?? CORPORATE_MAILBOX_INITIAL_STATE,
  );
  const [submitting, setSubmitting] = useState(false);
  const reconnect = mode === 'reconnect' && Boolean(accountId);
  const passwordRequired = !reconnect || !hasStoredPassword;

  const set = <K extends keyof CorporateMailboxFormState>(
    key: K,
    value: CorporateMailboxFormState[K],
  ) => setState((prev) => ({ ...prev, [key]: value }));

  const submit = async () => {
    if (!isCorporateFormComplete(state, passwordRequired)) {
      toast.error(
        passwordRequired ? 'Please fill in all fields.' : 'Please fill in mailbox settings.',
      );
      return;
    }
    setSubmitting(true);
    try {
      if (reconnect && accountId) {
        await mailApi.reconnectCorporate(accountId, buildReconnectPayload(state));
        toast.success('Mailbox reconnected.');
      } else {
        await mailApi.connectCorporate(buildConnectPayload(state));
        toast.success('Mailbox connected.');
      }
      onConnected();
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, 'Mailbox validation failed. Check the settings.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {lastError ? (
        <p className="text-destructive text-sm" role="alert">
          {lastError}
        </p>
      ) : null}
      <CorporateSettingsFields
        state={state}
        set={set}
        passwordPlaceholder={
          reconnect && hasStoredPassword ? 'Leave blank to keep saved password' : undefined
        }
      />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Back
        </Button>
        <Button type="button" onClick={() => void submit()} disabled={submitting}>
          {submitting ? 'Validating…' : reconnect ? 'Reconnect mailbox' : 'Connect mailbox'}
        </Button>
      </div>
    </div>
  );
}

function CorporateSettingsFields({
  state,
  set,
  passwordPlaceholder,
}: {
  state: CorporateMailboxFormState;
  set: <K extends keyof CorporateMailboxFormState>(
    key: K,
    value: CorporateMailboxFormState[K],
  ) => void;
  passwordPlaceholder?: string;
}) {
  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor="mb-email">Email</Label>
        <Input
          id="mb-email"
          type="email"
          value={state.email}
          onChange={(event) => set('email', event.target.value)}
          placeholder="user@company.com"
        />
      </div>
      <HostPortRow
        hostId="mb-imap-host"
        portId="mb-imap-port"
        hostLabel="IMAP host"
        portLabel="IMAP port"
        host={state.imapHost}
        port={state.imapPort}
        hostPlaceholder="imap.company.com"
        onHost={(value) => set('imapHost', value)}
        onPort={(value) => set('imapPort', value)}
      />
      <SecureModeField
        label="IMAP secure mode"
        value={state.imapSecure}
        onChange={(value) => set('imapSecure', value)}
      />
      <HostPortRow
        hostId="mb-smtp-host"
        portId="mb-smtp-port"
        hostLabel="SMTP host"
        portLabel="SMTP port"
        host={state.smtpHost}
        port={state.smtpPort}
        hostPlaceholder="smtp.company.com"
        onHost={(value) => set('smtpHost', value)}
        onPort={(value) => set('smtpPort', value)}
      />
      <SecureModeField
        label="SMTP secure mode"
        value={state.smtpSecure}
        onChange={(value) => set('smtpSecure', value)}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="mb-login">Login</Label>
          <Input
            id="mb-login"
            value={state.login}
            onChange={(event) => set('login', event.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="mb-password">Password</Label>
          <Input
            id="mb-password"
            type="password"
            value={state.password}
            onChange={(event) => set('password', event.target.value)}
            autoComplete="new-password"
            placeholder={passwordPlaceholder}
          />
        </div>
      </div>
    </>
  );
}

function HostPortRow(props: {
  hostId: string;
  portId: string;
  hostLabel: string;
  portLabel: string;
  host: string;
  port: string;
  hostPlaceholder: string;
  onHost: (value: string) => void;
  onPort: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="grid gap-2 sm:col-span-2">
        <Label htmlFor={props.hostId}>{props.hostLabel}</Label>
        <Input
          id={props.hostId}
          value={props.host}
          onChange={(event) => props.onHost(event.target.value)}
          placeholder={props.hostPlaceholder}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={props.portId}>{props.portLabel}</Label>
        <Input
          id={props.portId}
          inputMode="numeric"
          value={props.port}
          onChange={(event) => props.onPort(event.target.value)}
        />
      </div>
    </div>
  );
}

function SecureModeField(props: {
  label: string;
  value: MailSecureMode;
  onChange: (value: MailSecureMode) => void;
}) {
  return (
    <div className="grid gap-2">
      <Label>{props.label}</Label>
      <Select
        value={props.value}
        onValueChange={(value) => props.onChange(value as MailSecureMode)}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MAIL_SECURE_MODES.map((mode) => (
            <SelectItem key={mode} value={mode}>
              {mode}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function buildConnectPayload(state: CorporateMailboxFormState) {
  return {
    email: state.email.trim(),
    imapHost: state.imapHost.trim(),
    imapPort: Number(state.imapPort),
    imapSecure: state.imapSecure,
    smtpHost: state.smtpHost.trim(),
    smtpPort: Number(state.smtpPort),
    smtpSecure: state.smtpSecure,
    login: state.login.trim(),
    password: state.password,
  };
}

function buildReconnectPayload(state: CorporateMailboxFormState) {
  const payload = {
    email: state.email.trim(),
    imapHost: state.imapHost.trim(),
    imapPort: Number(state.imapPort),
    imapSecure: state.imapSecure,
    smtpHost: state.smtpHost.trim(),
    smtpPort: Number(state.smtpPort),
    smtpSecure: state.smtpSecure,
    login: state.login.trim(),
    ...(state.password ? { password: state.password } : {}),
  };
  return payload;
}
