import type { TechnicalReadinessItem } from './technical.types';

type ProductTechnicalProfileShape = {
  monitoringStatus: string;
  backupStatus: string;
};

type TechnicalAssetShape = {
  type: string;
  credentialId: string | null;
};

type TechnicalEnvironmentShape = {
  kind: string;
  envCredentialId: string | null;
};

interface TechnicalReadinessInput {
  profile: ProductTechnicalProfileShape;
  assets: TechnicalAssetShape[];
  environments: TechnicalEnvironmentShape[];
}

export function buildTechnicalReadiness(input: TechnicalReadinessInput) {
  const blockers = [
    missingProductionEnvironment(input.environments),
    missingCredentialLink(input.assets, input.environments),
    missingMonitoring(input.profile, input.assets),
    missingBackup(input.profile),
  ].filter((item): item is TechnicalReadinessItem => item !== null);

  return {
    isReadyForTransfer: blockers.length === 0,
    blockers,
    summary: {
      environmentCount: input.environments.length,
      assetCount: input.assets.length,
      credentialLinkedCount: countCredentialLinks(input.assets, input.environments),
      monitoringStatus: input.profile.monitoringStatus,
      backupStatus: input.profile.backupStatus,
    },
  };
}

function missingProductionEnvironment(environments: TechnicalEnvironmentShape[]) {
  if (environments.some((env) => env.kind === 'PRODUCTION')) return null;
  return readinessItem(
    'TECH_ENV_PRODUCTION_MISSING',
    'Production environment missing',
    'Add at least one Production environment before Transfer.',
  );
}

function missingCredentialLink(
  assets: TechnicalAssetShape[],
  environments: TechnicalEnvironmentShape[],
) {
  const hasCredential = countCredentialLinks(assets, environments) > 0;
  if (hasCredential) return null;
  return readinessItem(
    'TECH_CREDENTIAL_LINK_MISSING',
    'Credentials link missing',
    'Link Credentials records instead of storing secrets in Technical notes.',
  );
}

function missingMonitoring(profile: ProductTechnicalProfileShape, assets: TechnicalAssetShape[]) {
  const hasMonitoringAsset = assets.some((asset) => asset.type === 'MONITORING');
  if (hasMonitoringAsset || profile.monitoringStatus !== 'NOT_CONFIGURED') return null;
  return readinessItem(
    'TECH_MONITORING_MISSING',
    'Monitoring not configured',
    'Set monitoring status or add a Monitoring asset for production operations.',
  );
}

function missingBackup(profile: ProductTechnicalProfileShape) {
  if (profile.backupStatus !== 'MISSING' && profile.backupStatus !== 'UNKNOWN') return null;
  return readinessItem(
    'TECH_BACKUP_MISSING',
    'Backup policy missing',
    'Set backup status before handoff, even if backup is intentionally not required.',
  );
}

function countCredentialLinks(
  assets: TechnicalAssetShape[],
  environments: TechnicalEnvironmentShape[],
) {
  return (
    assets.filter((asset) => Boolean(asset.credentialId)).length +
    environments.filter((env) => Boolean(env.envCredentialId)).length
  );
}

function readinessItem(code: string, label: string, message: string): TechnicalReadinessItem {
  return { code, label, message };
}
