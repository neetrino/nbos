import type { GmailMailSecret, MailProviderSecret } from './mail-provider-secret.store';

/** Parsed Gmail JSON may still carry deprecated ephemeral OAuth fields. */
export type GmailMailSecretStored = GmailMailSecret & {
  accessToken?: string;
  expiryDate?: number;
};

/** Gmail blob persisted on disk — only refresh token (access token is ephemeral). */
export function normalizeGmailMailSecret(secret: GmailMailSecretStored): GmailMailSecret {
  return { kind: 'gmail', refreshToken: secret.refreshToken };
}

export function gmailSecretHasLegacyFields(secret: GmailMailSecretStored): boolean {
  return secret.accessToken !== undefined || secret.expiryDate !== undefined;
}

export function normalizeMailProviderSecret(
  secret: MailProviderSecret | GmailMailSecretStored,
): MailProviderSecret {
  if (secret.kind === 'gmail') {
    return normalizeGmailMailSecret(secret);
  }
  return secret;
}

export function mailProviderSecretNeedsNormalization(
  secret: MailProviderSecret | GmailMailSecretStored,
): boolean {
  return secret.kind === 'gmail' && gmailSecretHasLegacyFields(secret);
}
