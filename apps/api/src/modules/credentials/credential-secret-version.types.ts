import type { SensitiveField } from './credential-domain.types';

export type CredentialSecretRotationSource = 'PLANNED' | 'MANUAL' | 'EMERGENCY';

export interface CredentialSecretVersionRow {
  id: string;
  field: SensitiveField;
  versionNumber: number;
  rotatedAt: string;
  source: CredentialSecretRotationSource;
  reason: string | null;
  rotatedBy: { id: string; firstName: string; lastName: string };
}
