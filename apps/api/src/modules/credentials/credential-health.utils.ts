import {
  type CredentialHealthMetadata,
  type CredentialHealthStatus,
  type CredentialSecretsPresent,
} from './credential-domain.types';
import { daysDiffUtc } from './credential-date.utils';

export function buildCredentialHealth(
  nextRotationAt: Date | null,
  criticality: string | null,
  accessLevel: string | null,
  ownerId: string | null,
): CredentialHealthMetadata {
  const now = new Date();
  const dueInDays = nextRotationAt ? daysDiffUtc(now, nextRotationAt) : null;
  let status: CredentialHealthStatus = 'UNKNOWN';
  if (dueInDays !== null) {
    if (dueInDays < 0) status = 'OVERDUE';
    else if (dueInDays <= 14) status = 'DUE_SOON';
    else status = 'HEALTHY';
  }
  const flags: string[] = [];
  if ((criticality === 'HIGH' || criticality === 'CRITICAL') && !ownerId) {
    flags.push('MISSING_OWNER');
  }
  if ((criticality === 'HIGH' || criticality === 'CRITICAL') && accessLevel === 'ALL') {
    flags.push('BROAD_ACCESS');
  }
  return { status, dueInDays, flags };
}

export function buildSecretsPresent(row: Record<string, unknown>): CredentialSecretsPresent {
  const pick = (key: string) => typeof row[key] === 'string' && (row[key] as string).length > 0;
  return {
    password: pick('password'),
    passphrase: pick('passphrase'),
    apiKey: pick('apiKey'),
    envData: pick('envData'),
    secureNotes: pick('secureNotes'),
  };
}

export function toCredentialWithoutSecrets(credential: Record<string, unknown>) {
  const { password, passphrase, apiKey, envData, secureNotes, ...rest } = credential;
  const nextRotationAt =
    credential.nextRotationAt instanceof Date ? credential.nextRotationAt : null;
  const criticality = typeof credential.criticality === 'string' ? credential.criticality : null;
  const accessLevel = typeof credential.accessLevel === 'string' ? credential.accessLevel : null;
  const ownerId = typeof credential.ownerId === 'string' ? credential.ownerId : null;

  return {
    ...rest,
    secretsPresent: buildSecretsPresent({ password, passphrase, apiKey, envData, secureNotes }),
    health: buildCredentialHealth(nextRotationAt, criticality, accessLevel, ownerId),
  };
}
