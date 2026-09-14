'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InlineField } from '@/components/shared';
import {
  DETAIL_SHEET_FIELD_INNER_CONTROL_CLASS,
  DETAIL_SHEET_FORM_ACTION_BUTTON_SIZE,
  DETAIL_SHEET_OUTLINED_FIELD_SHELL_CLASS,
  DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS,
  DETAIL_SHEET_OUTLINED_LABEL_CLASS,
} from '@/components/shared/detail-sheet-classes';
import { mailApi, type MailSecureMode } from '@/lib/api/mail';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  CORPORATE_MAILBOX_INITIAL_STATE,
  isCorporateFormComplete,
  MAIL_SECURE_MODES,
  type CorporateMailboxFormState,
} from './corporate-mailbox-form-state';
import { MAIL_FIELD_GRID_CLASS } from './mail-ui-classes';

interface CorporateMailboxFormProps {
  onCancel: () => void;
  onConnected: () => void;
  mode?: 'connect' | 'reconnect';
  accountId?: string;
  initial?: CorporateMailboxFormState;
  hasStoredPassword?: boolean;
  lastError?: string | null;
}

const SECURE_MODE_OPTIONS = MAIL_SECURE_MODES.map((mode) => ({ value: mode, label: mode }));

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
        disabled={submitting}
        passwordPlaceholder={
          reconnect && hasStoredPassword ? 'Leave blank to keep saved password' : undefined
        }
      />
      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          size={DETAIL_SHEET_FORM_ACTION_BUTTON_SIZE}
          onClick={onCancel}
          disabled={submitting}
        >
          Back
        </Button>
        <Button
          type="button"
          size={DETAIL_SHEET_FORM_ACTION_BUTTON_SIZE}
          onClick={() => void submit()}
          disabled={submitting}
        >
          {submitting ? 'Validating…' : reconnect ? 'Reconnect mailbox' : 'Connect mailbox'}
        </Button>
      </div>
    </div>
  );
}

function CorporateSettingsFields({
  state,
  set,
  disabled,
  passwordPlaceholder,
}: {
  state: CorporateMailboxFormState;
  set: <K extends keyof CorporateMailboxFormState>(
    key: K,
    value: CorporateMailboxFormState[K],
  ) => void;
  disabled: boolean;
  passwordPlaceholder?: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <InlineField
        variant="controlled"
        label="Email"
        type="email"
        value={state.email}
        onValueChange={(value) => set('email', value)}
        placeholder="user@company.com"
        disabled={disabled}
      />
      <div className={MAIL_FIELD_GRID_CLASS}>
        <InlineField
          variant="controlled"
          label="IMAP host"
          type="text"
          value={state.imapHost}
          onValueChange={(value) => set('imapHost', value)}
          placeholder="imap.company.com"
          disabled={disabled}
        />
        <InlineField
          variant="controlled"
          label="IMAP port"
          type="text"
          value={state.imapPort}
          onValueChange={(value) => set('imapPort', value)}
          disabled={disabled}
        />
      </div>
      <InlineField
        variant="controlled"
        label="IMAP secure mode"
        type="select"
        value={state.imapSecure}
        options={SECURE_MODE_OPTIONS}
        onValueChange={(value) => set('imapSecure', value as MailSecureMode)}
        disabled={disabled}
      />
      <div className={MAIL_FIELD_GRID_CLASS}>
        <InlineField
          variant="controlled"
          label="SMTP host"
          type="text"
          value={state.smtpHost}
          onValueChange={(value) => set('smtpHost', value)}
          placeholder="smtp.company.com"
          disabled={disabled}
        />
        <InlineField
          variant="controlled"
          label="SMTP port"
          type="text"
          value={state.smtpPort}
          onValueChange={(value) => set('smtpPort', value)}
          disabled={disabled}
        />
      </div>
      <InlineField
        variant="controlled"
        label="SMTP secure mode"
        type="select"
        value={state.smtpSecure}
        options={SECURE_MODE_OPTIONS}
        onValueChange={(value) => set('smtpSecure', value as MailSecureMode)}
        disabled={disabled}
      />
      <div className={MAIL_FIELD_GRID_CLASS}>
        <InlineField
          variant="controlled"
          label="Login"
          type="text"
          value={state.login}
          onValueChange={(value) => set('login', value)}
          disabled={disabled}
        />
        <CorporatePasswordField
          value={state.password}
          onChange={(value) => set('password', value)}
          placeholder={passwordPlaceholder}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

function CorporatePasswordField({
  value,
  onChange,
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled: boolean;
}) {
  return (
    <div className={DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS}>
      <span className={DETAIL_SHEET_OUTLINED_LABEL_CLASS}>Password</span>
      <div className={DETAIL_SHEET_OUTLINED_FIELD_SHELL_CLASS}>
        <Input
          id="mb-password"
          type="password"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete="new-password"
          placeholder={placeholder}
          disabled={disabled}
          className={DETAIL_SHEET_FIELD_INNER_CONTROL_CLASS}
        />
      </div>
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
  return {
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
}
