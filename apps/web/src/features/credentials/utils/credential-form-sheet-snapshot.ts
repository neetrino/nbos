import type { CredentialManualGrant } from '@/lib/api/credentials';

export type CredentialFormSnapFields = {
  name: string;
  category: string;
  credentialType: string;
  comment: string;
  environment: string;
  provider: string;
  url: string;
  login: string;
  phone: string;
  criticality: string;
  nextRotationAt: string;
  manualGrants: CredentialManualGrant[];
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
    provider: fields.provider.trim(),
    url: fields.url.trim(),
    login: fields.login.trim(),
    phone: fields.phone.trim(),
    criticality: fields.criticality,
    nextRotationAt: fields.nextRotationAt.trim(),
    manual,
  });
}
