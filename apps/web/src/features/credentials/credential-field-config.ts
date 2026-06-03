import { CREDENTIAL_TYPES } from '@/features/credentials/constants/credentials';

export type CredentialFormField =
  | 'login'
  | 'password'
  | 'passphrase'
  | 'apiKey'
  | 'phone'
  | 'url'
  | 'envData';

export type DynamicFieldKind = 'text' | 'password' | 'textarea' | 'env';

export interface DynamicFieldSpec {
  field: CredentialFormField;
  label: string;
  kind: DynamicFieldKind;
  placeholder?: string;
}

const TYPE_FIELDS: Record<string, CredentialFormField[]> = {
  LOGIN_PASSWORD: ['url', 'login', 'password'],
  API_KEY: ['url', 'apiKey'],
  DATABASE: ['url', 'login', 'password'],
  SSH_PRIVATE_KEY: ['url', 'login', 'password', 'passphrase'],
  ENV_BUNDLE: ['envData'],
  DOMAIN_REGISTRAR: ['url', 'login', 'password'],
  HOSTING_SERVER: ['url', 'login', 'password'],
  APP_STORE_ACCOUNT: ['login', 'password'],
  MAIL_SMTP: ['url', 'login', 'password'],
  RECOVERY_CODES: [],
};

const FIELD_LABELS: Record<string, Partial<Record<CredentialFormField, string>>> = {
  SSH_PRIVATE_KEY: {
    url: 'Host',
    login: 'Username',
    password: 'Private key',
    passphrase: 'Passphrase (optional)',
  },
  DATABASE: { url: 'Connection URL', login: 'Username', password: 'Password' },
  API_KEY: { apiKey: 'API key / token', url: 'Dashboard URL' },
  DOMAIN_REGISTRAR: { url: 'Registrar panel URL', login: 'Account email', password: 'Password' },
  HOSTING_SERVER: { url: 'Panel URL', login: 'Login', password: 'Password' },
  MAIL_SMTP: { url: 'Webmail URL', login: 'Email', password: 'Password' },
  APP_STORE_ACCOUNT: {
    url: 'Portal URL',
    login: 'Apple ID / account',
    password: 'Password',
    phone: 'Phone (2FA)',
  },
  LOGIN_PASSWORD: { url: 'URL', login: 'Login', password: 'Password' },
};

const DEFAULT_LABELS: Record<CredentialFormField, string> = {
  url: 'URL',
  login: 'Login',
  password: 'Password',
  apiKey: 'API key',
  phone: 'Phone',
  envData: 'ENV bundle',
  passphrase: 'Passphrase',
};

export const CREDENTIAL_TYPES_FOR_CREATE = CREDENTIAL_TYPES;

export function fieldsForCredentialType(credentialType: string): CredentialFormField[] {
  return TYPE_FIELDS[credentialType] ?? ['login', 'password'];
}

export function dynamicFieldSpecsForType(credentialType: string): DynamicFieldSpec[] {
  return fieldsForCredentialType(credentialType).map((field) => {
    const label = FIELD_LABELS[credentialType]?.[field] ?? DEFAULT_LABELS[field];
    const kind: DynamicFieldKind =
      field === 'envData'
        ? 'env'
        : field === 'password' && credentialType === 'SSH_PRIVATE_KEY'
          ? 'textarea'
          : field === 'password' || field === 'passphrase' || field === 'apiKey'
            ? 'password'
            : 'text';
    return { field, label, kind };
  });
}

export function commentLabelForType(credentialType: string): string {
  return credentialType === 'RECOVERY_CODES' ? 'Recovery codes' : 'Comment';
}

const PROVIDER_REQUIRED_TYPES = ['DOMAIN_REGISTRAR', 'HOSTING_SERVER', 'MAIL_SMTP'] as const;

export function isProviderRequiredForType(credentialType: string): boolean {
  return (PROVIDER_REQUIRED_TYPES as readonly string[]).includes(credentialType);
}

export function isProviderFirstForType(credentialType: string): boolean {
  return isProviderRequiredForType(credentialType);
}

/** Provider catalog applies only to domain, hosting, and mail credential types. */
export function showsProviderPicker(credentialType: string): boolean {
  return isProviderRequiredForType(credentialType);
}
