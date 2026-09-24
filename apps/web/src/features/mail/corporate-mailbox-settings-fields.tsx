'use client';

import { Inbox, KeyRound, Mail, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { InlineField } from '@/components/shared';
import {
  DETAIL_SHEET_FIELD_INNER_CONTROL_CLASS,
  DETAIL_SHEET_OUTLINED_FIELD_SHELL_CLASS,
  DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS,
  DETAIL_SHEET_OUTLINED_LABEL_CLASS,
  DETAIL_SHEET_SECTION_SURFACE_CLASS,
  DETAIL_SHEET_SECTION_TITLE_CLASS,
} from '@/components/shared/detail-sheet-classes';
import type { MailSecureMode } from '@/lib/api/mail';
import { MAIL_SECURE_MODES, type CorporateMailboxFormState } from './corporate-mailbox-form-state';
import { MAIL_FIELD_GRID_CLASS } from './mail-ui-classes';

const SECURE_MODE_OPTIONS = MAIL_SECURE_MODES.map((mode) => ({ value: mode, label: mode }));

type FieldSetter = <K extends keyof CorporateMailboxFormState>(
  key: K,
  value: CorporateMailboxFormState[K],
) => void;

interface CorporateSettingsFieldsProps {
  state: CorporateMailboxFormState;
  set: FieldSetter;
  disabled: boolean;
  lastError?: string | null;
  passwordPlaceholder?: string;
}

export function CorporateSettingsFields({
  state,
  set,
  disabled,
  lastError,
  passwordPlaceholder,
}: CorporateSettingsFieldsProps) {
  return (
    <div className="flex flex-col gap-4">
      <AccountSection state={state} set={set} disabled={disabled} lastError={lastError} />
      <ImapSection state={state} set={set} disabled={disabled} />
      <SmtpSection state={state} set={set} disabled={disabled} />
      <SignInSection
        state={state}
        set={set}
        disabled={disabled}
        passwordPlaceholder={passwordPlaceholder}
      />
    </div>
  );
}

function AccountSection({
  state,
  set,
  disabled,
  lastError,
}: {
  state: CorporateMailboxFormState;
  set: FieldSetter;
  disabled: boolean;
  lastError?: string | null;
}) {
  return (
    <section className={DETAIL_SHEET_SECTION_SURFACE_CLASS}>
      <h3 className={DETAIL_SHEET_SECTION_TITLE_CLASS}>
        <Mail className="size-3.5" aria-hidden />
        Account
      </h3>
      {lastError ? (
        <p className="text-destructive mb-3 text-sm" role="alert">
          {lastError}
        </p>
      ) : null}
      <InlineField
        variant="controlled"
        label="Email"
        type="email"
        value={state.email}
        onValueChange={(value) => set('email', value)}
        placeholder="user@company.com"
        disabled={disabled}
      />
    </section>
  );
}

function ImapSection({
  state,
  set,
  disabled,
}: {
  state: CorporateMailboxFormState;
  set: FieldSetter;
  disabled: boolean;
}) {
  return (
    <section className={DETAIL_SHEET_SECTION_SURFACE_CLASS}>
      <h3 className={DETAIL_SHEET_SECTION_TITLE_CLASS}>
        <Inbox className="size-3.5" aria-hidden />
        Incoming (IMAP)
      </h3>
      <div className="flex flex-col gap-3">
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
      </div>
    </section>
  );
}

function SmtpSection({
  state,
  set,
  disabled,
}: {
  state: CorporateMailboxFormState;
  set: FieldSetter;
  disabled: boolean;
}) {
  return (
    <section className={DETAIL_SHEET_SECTION_SURFACE_CLASS}>
      <h3 className={DETAIL_SHEET_SECTION_TITLE_CLASS}>
        <Send className="size-3.5" aria-hidden />
        Outgoing (SMTP)
      </h3>
      <div className="flex flex-col gap-3">
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
      </div>
    </section>
  );
}

function SignInSection({
  state,
  set,
  disabled,
  passwordPlaceholder,
}: {
  state: CorporateMailboxFormState;
  set: FieldSetter;
  disabled: boolean;
  passwordPlaceholder?: string;
}) {
  return (
    <section className={DETAIL_SHEET_SECTION_SURFACE_CLASS}>
      <h3 className={DETAIL_SHEET_SECTION_TITLE_CLASS}>
        <KeyRound className="size-3.5" aria-hidden />
        Sign-in
      </h3>
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
    </section>
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
