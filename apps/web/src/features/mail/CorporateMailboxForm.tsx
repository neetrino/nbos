'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { mailApi } from '@/lib/api/mail';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  CORPORATE_MAILBOX_INITIAL_STATE,
  isCorporateFormComplete,
  type CorporateMailboxFormState,
} from './corporate-mailbox-form-state';
import { CorporateSettingsFields } from './corporate-mailbox-settings-fields';
import { MailboxFormActions } from './mailbox-form-actions';

interface CorporateMailboxFormProps {
  onCancel: () => void;
  onConnected: () => void;
  onDelete?: () => void;
  mode?: 'connect' | 'reconnect';
  accountId?: string;
  initial?: CorporateMailboxFormState;
  hasStoredPassword?: boolean;
  lastError?: string | null;
}

export function CorporateMailboxForm({
  onCancel,
  onConnected,
  onDelete,
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
      <CorporateSettingsFields
        state={state}
        set={set}
        disabled={submitting}
        lastError={lastError}
        passwordPlaceholder={
          reconnect && hasStoredPassword ? 'Leave blank to keep saved password' : undefined
        }
      />
      <MailboxFormActions
        submitting={submitting}
        cancelLabel={reconnect ? 'Cancel' : 'Back'}
        primaryLabel={
          submitting ? 'Validating…' : reconnect ? 'Reconnect mailbox' : 'Connect mailbox'
        }
        onCancel={onCancel}
        onSubmit={() => void submit()}
        onDelete={reconnect ? onDelete : undefined}
      />
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
