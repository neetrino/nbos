import type { MailAccountRow, MailSecureMode } from '@/lib/api/mail';

export const MAIL_SECURE_MODES: MailSecureMode[] = ['SSL', 'STARTTLS', 'NONE'];

export interface CorporateMailboxFormState {
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

export const CORPORATE_MAILBOX_INITIAL_STATE: CorporateMailboxFormState = {
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

function asSecureMode(value: string | null | undefined): MailSecureMode {
  if (value === 'STARTTLS' || value === 'NONE' || value === 'SSL') {
    return value;
  }
  return 'SSL';
}

export function corporateFormStateFromAccount(account: MailAccountRow): CorporateMailboxFormState {
  const connection = account.providerConnection;
  return {
    email: account.emailAddress,
    imapHost: connection?.imapHost ?? '',
    imapPort: String(connection?.imapPort ?? 993),
    imapSecure: asSecureMode(connection?.secureMode),
    smtpHost: connection?.smtpHost ?? '',
    smtpPort: String(connection?.smtpPort ?? 465),
    smtpSecure: asSecureMode(connection?.smtpSecureMode),
    login: connection?.username ?? '',
    password: '',
  };
}

export function isCorporateFormComplete(
  state: CorporateMailboxFormState,
  passwordRequired: boolean,
): boolean {
  const ready = Boolean(
    state.email &&
    state.imapHost &&
    state.imapPort &&
    state.smtpHost &&
    state.smtpPort &&
    state.login,
  );
  return passwordRequired ? ready && Boolean(state.password) : ready;
}
