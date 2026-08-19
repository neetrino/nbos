import { UnprocessableEntityException } from '@nestjs/common';
import type { ValidateConnectionResult } from './providers/mail-provider-adapter';
import { ImapSmtpProviderAdapter } from './providers/imap-smtp.adapter';
import { isSecureModeTls } from './providers/mail-provider-adapter.factory';
import {
  MAIL_NEEDS_RECONNECT_CODE,
  type CorporateMailboxSettings,
} from './mail-connect-corporate.ops';

export async function validateCorporateMailbox(
  settings: CorporateMailboxSettings,
  password: string,
): Promise<ValidateConnectionResult> {
  const adapter = new ImapSmtpProviderAdapter({
    emailAddress: settings.email,
    displayName: settings.displayName ?? null,
    login: settings.login,
    password,
    imapHost: settings.imapHost,
    imapPort: settings.imapPort,
    imapSecure: isSecureModeTls(settings.imapSecure),
    smtpHost: settings.smtpHost,
    smtpPort: settings.smtpPort,
    smtpSecure: isSecureModeTls(settings.smtpSecure),
  });
  return adapter.validateConnection();
}

export function mailboxNeedsReconnectException(
  accountId: string,
  message: string,
): UnprocessableEntityException {
  return new UnprocessableEntityException({
    message,
    error: 'Unprocessable Entity',
    code: MAIL_NEEDS_RECONNECT_CODE,
    details: { accountId },
  });
}
