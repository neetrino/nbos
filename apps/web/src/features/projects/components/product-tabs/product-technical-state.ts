import type {
  TechnicalAssetType,
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
