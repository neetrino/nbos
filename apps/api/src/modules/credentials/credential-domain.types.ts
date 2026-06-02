import type { CredentialTab } from './credential-tab';

export const SENSITIVE_FIELDS = ['password', 'apiKey', 'envData', 'secureNotes'] as const;
export type SensitiveField = (typeof SENSITIVE_FIELDS)[number];

export const CREDENTIAL_SECRET_FIELD_NAMES = SENSITIVE_FIELDS;

export interface CredentialSecretsPresent {
  password: boolean;
  apiKey: boolean;
  envData: boolean;
  secureNotes: boolean;
}

export type CredentialHealthStatus = 'HEALTHY' | 'DUE_SOON' | 'OVERDUE' | 'UNKNOWN';

export interface CredentialHealthMetadata {
  status: CredentialHealthStatus;
  dueInDays: number | null;
  flags: string[];
}

export interface CredentialQueryParams {
  page?: number;
  pageSize?: number;
  projectId?: string;
  category?: string;
  credentialType?: string;
  accessLevel?: string;
  search?: string;
  tab?: CredentialTab;
  employeeId?: string;
  ownerId?: string;
  departmentIds?: string[];
  needsRotation?: boolean;
  viewScope?: string;
  includeArchived?: boolean;
}

export interface ExportCredentialsInput {
  credentialIds?: string[];
  fields?: string[];
  stepUpPassword?: string;
}

export interface CreateCredentialDto {
  projectId?: string;
  productId?: string;
  domainId?: string;
  clientServiceRecordId?: string;
  departmentId?: string;
  ownerId?: string;
  category: string;
  credentialType?: string;
  criticality?: string;
  environment?: string;
  provider?: string;
  name: string;
  url?: string;
  login?: string;
  password?: string;
  apiKey?: string;
  envData?: string;
  phone?: string;
  notes?: string;
  publicNotes?: string;
  secureNotes?: string;
  lastRotatedAt?: string;
  nextRotationAt?: string;
  rotationOwnerId?: string;
  accessLevel?: string;
  allowedEmployees?: string[];
}

export interface UpdateCredentialDto {
  projectId?: string;
  productId?: string;
  domainId?: string;
  clientServiceRecordId?: string;
  departmentId?: string;
  category?: string;
  credentialType?: string;
  criticality?: string;
  environment?: string;
  provider?: string;
  name?: string;
  url?: string;
  login?: string;
  password?: string;
  apiKey?: string;
  envData?: string;
  phone?: string;
  notes?: string;
  publicNotes?: string;
  secureNotes?: string;
  lastRotatedAt?: string | null;
  nextRotationAt?: string | null;
  rotationOwnerId?: string | null;
  accessLevel?: string;
  allowedEmployees?: string[];
}
