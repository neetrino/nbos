export interface CredentialListItem {
  id: string;
  name: string;
  category: string;
  credentialType: string;
  criticality: string;
  provider: string | null;
  url: string | null;
  login: string | null;
  phone: string | null;
  appStorePlatform?: 'APPLE' | 'GOOGLE' | null;
  accessLevel: string;
  allowedEmployees: string[];
  ownerId?: string | null;
  project: { id: string; name: string } | null;
  department: { id: string; name: string } | null;
  owner: { id: string; firstName: string; lastName: string } | null;
  createdAt: string;
  isFavorite?: boolean;
  folders?: { id: string; name: string; isPrimary: boolean }[];
  nextRotationAt?: string | null;
  health?: {
    status: 'HEALTHY' | 'DUE_SOON' | 'OVERDUE' | 'UNKNOWN';
    dueInDays: number | null;
    flags: string[];
  };
  secretsPresent?: {
    password: boolean;
    passphrase?: boolean;
    apiKey: boolean;
    envData: boolean;
    secureNotes: boolean;
  };
}
