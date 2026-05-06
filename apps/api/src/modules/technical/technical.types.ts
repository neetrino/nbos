import type {
  TechnicalAssetStatus,
  TechnicalAssetType,
  TechnicalBackupStatus,
  TechnicalDeployStatus,
  TechnicalEnvironmentKind,
  TechnicalHealthStatus,
} from '@nbos/database';

export interface UpdateTechnicalProfileDto {
  technicalOwnerId?: string | null;
  productionUrl?: string | null;
  stagingUrl?: string | null;
  repositoryUrl?: string | null;
  deploymentMethod?: string | null;
  hostingProvider?: string | null;
  monitoringStatus?: TechnicalHealthStatus;
  backupStatus?: TechnicalBackupStatus;
  lastDeployAt?: string | null;
  lastDeployStatus?: TechnicalDeployStatus;
  technicalNotes?: string | null;
}

export interface CreateTechnicalAssetDto {
  type?: TechnicalAssetType;
  name?: string;
  provider?: string | null;
  environment?: TechnicalEnvironmentKind | null;
  status?: TechnicalAssetStatus;
  url?: string | null;
  ownerId?: string | null;
  credentialId?: string | null;
  clientServiceRecordId?: string | null;
  notes?: string | null;
}

export type UpdateTechnicalAssetDto = Partial<CreateTechnicalAssetDto>;

export interface CreateTechnicalEnvironmentDto {
  kind?: TechnicalEnvironmentKind;
  name?: string;
  url?: string | null;
  branch?: string | null;
  deploymentTarget?: string | null;
  envCredentialId?: string | null;
  databaseAssetId?: string | null;
  status?: TechnicalHealthStatus;
  lastCheckedAt?: string | null;
}

export type UpdateTechnicalEnvironmentDto = Partial<CreateTechnicalEnvironmentDto>;

export interface TechnicalReadinessItem {
  code: string;
  label: string;
  message: string;
}

export interface RecordTechnicalDeployDto {
  status?: TechnicalDeployStatus;
  environment?: TechnicalEnvironmentKind | null;
  version?: string | null;
  notes?: string | null;
  deployedAt?: string | null;
}

export interface UpdateTechnicalBackupPolicyDto {
  backupStatus?: TechnicalBackupStatus;
  policyName?: string | null;
  rpoHours?: number | null;
  rtoHours?: number | null;
  restoreTestCadenceDays?: number | null;
  notes?: string | null;
}
