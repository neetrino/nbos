/** Secret columns that may exist on a credential row (not including secureNotes). */
export type CredentialStoredSecretField = 'password' | 'passphrase' | 'apiKey' | 'envData';

export interface CredentialSecretsPresentFlags {
  password: boolean;
  passphrase: boolean;
  apiKey: boolean;
  envData: boolean;
  secureNotes?: boolean;
}

export type CredentialTypeLane = 'L1' | 'L2' | 'L3';
export type CredentialTypeChangeLevel = 'green' | 'red';

const L1_TYPES = new Set([
  'LOGIN_PASSWORD',
  'DATABASE',
  'SSH_PRIVATE_KEY',
  'DOMAIN_REGISTRAR',
  'HOSTING_SERVER',
  'APP_STORE_ACCOUNT',
  'MAIL_SMTP',
]);

const L2_TYPES = new Set(['API_KEY', 'OTHER_SECRET']);
const L3_TYPES = new Set(['ENV_BUNDLE']);

/** Non-secret form fields per type (used for draft clearing on web). */
const TYPE_FORM_FIELDS: Record<string, readonly string[]> = {
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
  OTHER_SECRET: ['apiKey'],
};

export function laneForCredentialType(credentialType: string): CredentialTypeLane | null {
  if (L1_TYPES.has(credentialType)) return 'L1';
  if (L2_TYPES.has(credentialType)) return 'L2';
  if (L3_TYPES.has(credentialType)) return 'L3';
  return null;
}

export function formFieldsForCredentialType(credentialType: string): readonly string[] {
  return TYPE_FORM_FIELDS[credentialType] ?? ['login', 'password'];
}

export function visibleStoredSecretsForType(credentialType: string): CredentialStoredSecretField[] {
  const fields = formFieldsForCredentialType(credentialType);
  const out: CredentialStoredSecretField[] = [];
  if (fields.includes('password')) out.push('password');
  if (fields.includes('passphrase')) out.push('passphrase');
  if (fields.includes('apiKey')) out.push('apiKey');
  if (fields.includes('envData')) out.push('envData');
  return out;
}

/** Mirrors web sheet lanes: same-lane changes are green; cross-lane with orphaned secrets is red. */
export function classifyCredentialTypeChange(
  fromType: string,
  toType: string,
  secretsPresent: CredentialSecretsPresentFlags | null | undefined,
): CredentialTypeChangeLevel {
  if (fromType === toType) return 'green';
  const fromLane = laneForCredentialType(fromType);
  const toLane = laneForCredentialType(toType);
  if (fromLane && toLane && fromLane === toLane) return 'green';
  if (!secretsPresent) return 'green';

  const targetVisible = new Set(visibleStoredSecretsForType(toType));
  const orphaned = (['password', 'passphrase', 'apiKey', 'envData'] as const).filter(
    (field) => secretsPresent[field] && !targetVisible.has(field),
  );
  return orphaned.length > 0 ? 'red' : 'green';
}
