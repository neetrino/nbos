import type { CredentialManualGrant } from '@/lib/api/credentials';

export type CredentialFormSnapFields = {
  name: string;
  category: string;
  credentialType: string;
  comment: string;
  environment: string;
  providerId: string | null;
  url: string;
  login: string;
  phone: string;
  criticality: string;
  nextRotationAt: string;
  manualGrants: CredentialManualGrant[];
};

/** Full form state restored when a background save fails. */
export type CredentialFormRollbackState = CredentialFormSnapFields & {
  providerName: string;
  accessLevel: string;
  password: string;
  apiKey: string;
  envData: string;
  snap: string;
};

/** Stable JSON for dirty detection on the credential Sheet. */
export function buildCredentialFormSnap(fields: CredentialFormSnapFields): string {
  const manual = fields.manualGrants.map((g) => ({
    employeeId: g.employeeId,
    level: g.level,
    expiresAt: g.expiresAt,
  }));
  return JSON.stringify({
    name: fields.name.trim(),
    category: fields.category,
    credentialType: fields.credentialType,
    comment: fields.comment,
    environment: fields.environment.trim(),
    providerId: fields.providerId,
    url: fields.url.trim(),
    login: fields.login.trim(),
    phone: fields.phone.trim(),
    criticality: fields.criticality,
    nextRotationAt: fields.nextRotationAt.trim(),
    manual,
  });
}
