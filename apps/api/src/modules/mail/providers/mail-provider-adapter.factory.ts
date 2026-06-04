import { BadRequestException, Injectable } from '@nestjs/common';
import { GmailProviderAdapter } from './gmail.adapter';
import { ImapSmtpProviderAdapter } from './imap-smtp.adapter';
import type { MailProviderAdapter } from './mail-provider-adapter';
import { MailProviderConfig } from './mail-provider.config';
import { MailProviderSecretStore } from './mail-provider-secret.store';

export interface ConnectionForAdapter {
  mailAccountId: string;
  emailAddress: string;
  displayName: string | null;
  providerType: string;
  username: string | null;
  imapHost: string | null;
  imapPort: number | null;
  secureMode: string | null;
  smtpHost: string | null;
  smtpPort: number | null;
  smtpSecureMode: string | null;
}

/** Maps a stored secure-mode label to the boolean expected by IMAP/SMTP clients. */
export function isSecureModeTls(secureMode: string | null): boolean {
  if (!secureMode) {
    return true;
  }
  const normalized = secureMode.trim().toUpperCase();
  return (
    normalized === 'SSL' ||
    normalized === 'TLS' ||
    normalized === 'SSL/TLS' ||
    normalized === 'TRUE'
  );
}

@Injectable()
export class MailProviderAdapterFactory {
  constructor(
    private readonly secretStore: MailProviderSecretStore,
    private readonly config: MailProviderConfig,
  ) {}

  async forConnection(connection: ConnectionForAdapter): Promise<MailProviderAdapter> {
    const secret = await this.secretStore.read(connection.mailAccountId);
    if (!secret) {
      throw new BadRequestException('Mailbox has no stored credential; reconnect required');
    }
    if (connection.providerType === 'GMAIL') {
      if (secret.kind !== 'gmail') {
        throw new BadRequestException('Mailbox credential type mismatch');
      }
      return new GmailProviderAdapter({
        emailAddress: connection.emailAddress,
        displayName: connection.displayName,
        clientId: this.config.googleClientId,
        clientSecret: this.config.googleClientSecret,
        redirectUri: this.config.googleRedirectUri,
        refreshToken: secret.refreshToken,
        pubsubTopic: this.config.gmailPubsubTopic,
      });
    }
    if (secret.kind !== 'corporate') {
      throw new BadRequestException('Mailbox credential type mismatch');
    }
    return new ImapSmtpProviderAdapter({
      emailAddress: connection.emailAddress,
      displayName: connection.displayName,
      login: connection.username ?? connection.emailAddress,
      password: secret.password,
      imapHost: requireField(connection.imapHost, 'IMAP host'),
      imapPort: requireField(connection.imapPort, 'IMAP port'),
      imapSecure: isSecureModeTls(connection.secureMode),
      smtpHost: requireField(connection.smtpHost, 'SMTP host'),
      smtpPort: requireField(connection.smtpPort, 'SMTP port'),
      smtpSecure: isSecureModeTls(connection.smtpSecureMode),
    });
  }
}

function requireField<T>(value: T | null, label: string): T {
  if (value === null || value === undefined) {
    throw new BadRequestException(`Mailbox connection is missing ${label}`);
  }
  return value;
}
