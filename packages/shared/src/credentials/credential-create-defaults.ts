const ROTATION_INTERVAL_DAYS: Record<string, number> = {
  CRITICAL: 90,
  HIGH: 90,
  MEDIUM: 180,
  LOW: 365,
};

const TYPE_BASE_CRITICALITY: Record<string, string> = {
  ENV_BUNDLE: 'HIGH',
  SSH_PRIVATE_KEY: 'CRITICAL',
  RECOVERY_CODES: 'CRITICAL',
  DATABASE: 'HIGH',
  API_KEY: 'HIGH',
  LOGIN_PASSWORD: 'MEDIUM',
  DOMAIN_REGISTRAR: 'MEDIUM',
  HOSTING_SERVER: 'HIGH',
  APP_STORE_ACCOUNT: 'HIGH',
  MAIL_SMTP: 'MEDIUM',
};

const CRITICALITY_RANK: Record<string, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

function maxCriticality(a: string, b: string): string {
  return (CRITICALITY_RANK[a] ?? 0) >= (CRITICALITY_RANK[b] ?? 0) ? a : b;
}

function addUtcDays(from: Date, days: number): Date {
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export interface CredentialCreateDefaultsInput {
  credentialType: string;
  accessLevel: string;
}

export interface CredentialCreateDefaults {
  criticality: string;
  nextRotationAt: string;
}

/** Auto criticality and default next rotation when client omits them on create. */
export function resolveCredentialCreateDefaults(
  input: CredentialCreateDefaultsInput,
): CredentialCreateDefaults {
  let criticality = TYPE_BASE_CRITICALITY[input.credentialType] ?? 'MEDIUM';

  if (input.accessLevel === 'SECRET') {
    criticality = maxCriticality(criticality, 'HIGH');
  }

  const intervalDays = ROTATION_INTERVAL_DAYS[criticality] ?? ROTATION_INTERVAL_DAYS.MEDIUM;
  const nextRotationAt = addUtcDays(new Date(), intervalDays).toISOString();

  return { criticality, nextRotationAt };
}
