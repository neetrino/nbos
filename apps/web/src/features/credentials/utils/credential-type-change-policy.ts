import type { CredentialSecretsPresent, CredentialSecretField } from '@/lib/api/credentials';
import type { CredentialFormField } from '@/features/credentials/credential-field-config';
import { fieldsForCredentialType } from '@/features/credentials/credential-field-config';

export type CredentialTypeLane = 'L1' | 'L2' | 'L3';

export type TypeChangeLevel = 'green' | 'red';

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

export function laneForCredentialType(credentialType: string): CredentialTypeLane | null {
  if (L1_TYPES.has(credentialType)) return 'L1';
  if (L2_TYPES.has(credentialType)) return 'L2';
  if (L3_TYPES.has(credentialType)) return 'L3';
  return null;
}

/** Secret columns visible in the form for a given type. */
export function visibleSecretFieldsForType(credentialType: string): CredentialSecretField[] {
  const fields = fieldsForCredentialType(credentialType);
  const out: CredentialSecretField[] = [];
  if (fields.includes('password')) out.push('password');
  if (fields.includes('passphrase')) out.push('passphrase');
  if (fields.includes('apiKey')) out.push('apiKey');
  if (fields.includes('envData')) out.push('envData');
  return out;
}

export function classifyCredentialTypeChange(
  fromType: string,
  toType: string,
  secretsPresent: CredentialSecretsPresent | null | undefined,
): TypeChangeLevel {
  if (fromType === toType) return 'green';
  const fromLane = laneForCredentialType(fromType);
  const toLane = laneForCredentialType(toType);
  if (fromLane && toLane && fromLane === toLane) return 'green';

  if (!secretsPresent) return 'green';

  const targetVisible = new Set(visibleSecretFieldsForType(toType));
  const orphaned = (['password', 'passphrase', 'apiKey', 'envData'] as const).filter(
    (field) => secretsPresent[field] && !targetVisible.has(field),
  );
  return orphaned.length > 0 ? 'red' : 'green';
}

export interface CredentialDraftClearHandlers {
  setLogin: (v: string) => void;
  setPassword: (v: string) => void;
  setPassphrase: (v: string) => void;
  setApiKey: (v: string) => void;
  setEnvData: (v: string) => void;
  setUrl: (v: string) => void;
  setPhones: (phones: string[]) => void;
}

function fieldKeysForType(type: string): Set<CredentialFormField> {
  return new Set(fieldsForCredentialType(type));
}

/** Clears local draft values that do not apply after a type change (create mode). */
export function clearCredentialDraftForTypeChange(
  _fromType: string,
  toType: string,
  handlers: CredentialDraftClearHandlers,
): void {
  const allowed = fieldKeysForType(toType);
  if (!allowed.has('login')) handlers.setLogin('');
  if (!allowed.has('password')) handlers.setPassword('');
  if (!allowed.has('passphrase')) handlers.setPassphrase('');
  if (!allowed.has('apiKey')) handlers.setApiKey('');
  if (!allowed.has('envData')) handlers.setEnvData('');
  if (!allowed.has('url')) handlers.setUrl('');
  if (!allowed.has('phone')) handlers.setPhones(['']);
}
