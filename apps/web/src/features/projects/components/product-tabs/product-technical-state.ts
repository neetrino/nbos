import type {
  TechnicalAssetType,
  TechnicalBackupStatus,
  TechnicalDeployStatus,
  TechnicalEnvironmentKind,
  TechnicalProductProfileResponse,
} from '@/lib/api/technical';

export function profileDraftFromData(data: TechnicalProductProfileResponse) {
  return {
    productionUrl: data.profile.productionUrl ?? '',
    repositoryUrl: data.profile.repositoryUrl ?? '',
    hostingProvider: data.profile.hostingProvider ?? '',
  };
}

export function emptyProfileDraft() {
  return { productionUrl: '', repositoryUrl: '', hostingProvider: '' };
}

export function emptyAssetDraft() {
  return { name: '', type: 'HOSTING' as TechnicalAssetType, provider: '' };
}

export function emptyEnvironmentDraft() {
  return { name: 'Production', kind: 'PRODUCTION' as TechnicalEnvironmentKind, url: '' };
}

export function emptyDeployDraft() {
  return {
    status: 'SUCCESS' as TechnicalDeployStatus,
    environment: 'PRODUCTION' as TechnicalEnvironmentKind,
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

export function technicalAssetItems(data: TechnicalProductProfileResponse) {
  return data.assets.map((asset) => ({
    id: asset.id,
    title: asset.name,
    meta: `${asset.type}${asset.provider ? ` - ${asset.provider}` : ''}`,
    status: asset.status,
  }));
}

export function technicalEnvironmentItems(data: TechnicalProductProfileResponse) {
  return data.environments.map((env) => ({
    id: env.id,
    title: env.name,
    meta: `${env.kind}${env.url ? ` - ${env.url}` : ''}`,
    status: env.status,
  }));
}
