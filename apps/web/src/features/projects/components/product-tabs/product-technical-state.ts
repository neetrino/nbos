import type {
  TechnicalAssetType,
  TechnicalBackupStatus,
  TechnicalDeployStatus,
  TechnicalEnvironmentKind,
  TechnicalProductProfileResponse,
} from '@/lib/api/technical';

export const TECHNICAL_ASSET_TYPES: TechnicalAssetType[] = [
  'DOMAIN',
  'HOSTING',
  'REPOSITORY',
  'DATABASE',
  'STORAGE',
  'MONITORING',
  'OTHER',
];

export const TECHNICAL_ENVIRONMENT_KINDS: TechnicalEnvironmentKind[] = [
  'PRODUCTION',
  'STAGING',
  'DEVELOPMENT',
  'PREVIEW',
  'LEGACY',
];

export const TECHNICAL_DEPLOY_STATUSES: TechnicalDeployStatus[] = [
  'SUCCESS',
  'FAILED',
  'ROLLED_BACK',
  'UNKNOWN',
];

export const TECHNICAL_BACKUP_STATUSES: TechnicalBackupStatus[] = [
  'HEALTHY',
  'WARNING',
  'MISSING',
  'NOT_REQUIRED',
  'UNKNOWN',
];

export type TechnicalProfileDraft = {
  productionUrl: string;
  repositoryUrl: string;
  hostingProvider: string;
};

export type TechnicalAssetDraft = {
  name: string;
  type: TechnicalAssetType;
  provider: string;
};

export type TechnicalEnvironmentDraft = {
  name: string;
  kind: TechnicalEnvironmentKind;
  url: string;
};

export type TechnicalDeployDraft = {
  status: TechnicalDeployStatus;
  environment: TechnicalEnvironmentKind;
  version: string;
  notes: string;
};

export function profileDraftFromData(data: TechnicalProductProfileResponse): TechnicalProfileDraft {
  return {
    productionUrl: data.profile.productionUrl ?? '',
    repositoryUrl: data.profile.repositoryUrl ?? '',
    hostingProvider: data.profile.hostingProvider ?? '',
  };
}

export function emptyProfileDraft(): TechnicalProfileDraft {
  return { productionUrl: '', repositoryUrl: '', hostingProvider: '' };
}

export function emptyAssetDraft(): TechnicalAssetDraft {
  return { name: '', type: 'HOSTING', provider: '' };
}

export function emptyEnvironmentDraft(): TechnicalEnvironmentDraft {
  return { name: 'Production', kind: 'PRODUCTION', url: '' };
}

export function emptyDeployDraft(): TechnicalDeployDraft {
  return {
    status: 'SUCCESS',
    environment: 'PRODUCTION',
    version: '',
    notes: '',
  };
}

export function backupPolicyDraftFromData(data: TechnicalProductProfileResponse) {
  const payload = data.backupPolicy?.payload;
  return {
    backupStatus: (payload?.backupStatus ??
      data.profile.backupStatus ??
      'UNKNOWN') as TechnicalBackupStatus,
    policyName: payload?.policyName ?? '',
    rpoHours: payload?.rpoHours != null ? String(payload.rpoHours) : '',
    rtoHours: payload?.rtoHours != null ? String(payload.rtoHours) : '',
    restoreTestCadenceDays:
      payload?.restoreTestCadenceDays != null ? String(payload.restoreTestCadenceDays) : '',
    notes: payload?.notes ?? '',
  };
}

export type TechnicalBackupPolicyDraft = ReturnType<typeof backupPolicyDraftFromData>;

export function emptyBackupPolicyDraft(): TechnicalBackupPolicyDraft {
  return {
    backupStatus: 'UNKNOWN',
    policyName: '',
    rpoHours: '',
    rtoHours: '',
    restoreTestCadenceDays: '',
    notes: '',
  };
}

export function technicalAssetItems(data: TechnicalProductProfileResponse) {
  return data.assets.map((asset) => ({
    id: asset.id,
    title: asset.name,
    meta: `${asset.type}${asset.provider ? ` · ${asset.provider}` : ''}${asset.url ? ` · ${asset.url}` : ''}`,
    status: asset.status,
  }));
}

export function technicalEnvironmentItems(data: TechnicalProductProfileResponse) {
  return data.environments.map((env) => ({
    id: env.id,
    title: env.name,
    meta: `${env.kind}${env.url ? ` · ${env.url}` : ''}${env.branch ? ` · ${env.branch}` : ''}`,
    status: env.status,
  }));
}

export function filterTechnicalListItems<T extends { title: string; meta: string; status: string }>(
  items: T[],
  search: string,
): T[] {
  const query = search.trim().toLowerCase();
  if (!query) return items;
  return items.filter(
    (item) =>
      item.title.toLowerCase().includes(query) ||
      item.meta.toLowerCase().includes(query) ||
      item.status.toLowerCase().includes(query),
  );
}
