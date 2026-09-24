'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DETAIL_SHEET_FORM_ACTION_BUTTON_SIZE } from '@/components/shared/detail-sheet-classes';
import { mailApi } from '@/lib/api/mail';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  CORPORATE_MAILBOX_INITIAL_STATE,
  isCorporateFormComplete,
  type CorporateMailboxFormState,
} from './corporate-mailbox-form-state';
import { CorporateSettingsFields } from './corporate-mailbox-settings-fields';

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
        reconnect={reconnect}
        submitting={submitting}
        onCancel={onCancel}
        onSubmit={() => void submit()}
      />
    </div>
  );
}

function MailboxFormActions({
  reconnect,
  submitting,
  onCancel,
  onSubmit,
}: {
  reconnect: boolean;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="flex justify-end gap-2">
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
        onClick={onSubmit}
        disabled={submitting}
      >
        {submitting ? 'Validating…' : reconnect ? 'Reconnect mailbox' : 'Connect mailbox'}
      </Button>
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
