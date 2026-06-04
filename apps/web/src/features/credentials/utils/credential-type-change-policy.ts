import type { CredentialSecretsPresent, CredentialSecretField } from '@/lib/api/credentials';
import type { CredentialFormField } from '@/features/credentials/credential-field-config';
import {
  fieldsForCredentialType,
  isProviderRequiredForType,
} from '@/features/credentials/credential-field-config';
import {
  classifyCredentialTypeChange,
  laneForCredentialType,
  type CredentialTypeLane,
  type CredentialTypeChangeLevel,
} from '@nbos/shared';

export type { CredentialTypeLane, CredentialTypeChangeLevel as TypeChangeLevel };

export { classifyCredentialTypeChange, laneForCredentialType };

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

export interface CredentialDraftClearHandlers {
  setLogin: (v: string) => void;
  setPassword: (v: string) => void;
  setPassphrase: (v: string) => void;
  setApiKey: (v: string) => void;
  setEnvData: (v: string) => void;
  setUrl: (v: string) => void;
  setPhones: (phones: string[]) => void;
  clearProvider?: () => void;
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
  if (!isProviderRequiredForType(toType)) handlers.clearProvider?.();
}
