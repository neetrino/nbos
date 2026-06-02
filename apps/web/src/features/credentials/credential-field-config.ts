export type CredentialFormField = 'login' | 'password' | 'apiKey' | 'phone' | 'url' | 'envData';

const TYPE_FIELDS: Record<string, CredentialFormField[]> = {
  LOGIN_PASSWORD: ['url', 'login', 'password'],
  API_KEY: ['url', 'apiKey'],
  DATABASE: ['url', 'login', 'password'],
  SSH_PRIVATE_KEY: ['login', 'password'],
  ENV_BUNDLE: ['envData'],
  DOMAIN_REGISTRAR: ['url', 'login', 'password'],
  HOSTING_SERVER: ['url', 'login', 'password'],
  APP_STORE_ACCOUNT: ['url', 'login', 'password'],
  MAIL_SMTP: ['url', 'login', 'password'],
  RECOVERY_CODES: [],
  OTHER_SECRET: ['apiKey'],
};

export function fieldsForCredentialType(credentialType: string): CredentialFormField[] {
  return TYPE_FIELDS[credentialType] ?? ['login', 'password'];
}

export function commentLabelForType(credentialType: string): string {
  return credentialType === 'RECOVERY_CODES' ? 'Recovery codes' : 'Comment';
}
