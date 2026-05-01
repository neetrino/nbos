import { api } from '../api';

export type TechnicalHealthStatus =
  | 'HEALTHY'
  | 'WARNING'
  | 'CRITICAL'
  | 'NOT_CONFIGURED'
  | 'UNKNOWN';
export type TechnicalBackupStatus = 'HEALTHY' | 'WARNING' | 'MISSING' | 'NOT_REQUIRED' | 'UNKNOWN';
export type TechnicalDeployStatus = 'SUCCESS' | 'FAILED' | 'ROLLED_BACK' | 'UNKNOWN';
export type TechnicalAssetType =
  | 'DOMAIN'
  | 'HOSTING'
  | 'REPOSITORY'
  | 'DATABASE'
  | 'STORAGE'
  | 'MONITORING'
  | 'ERROR_TRACKING'
  | 'EXTERNAL_API'
  | 'QUEUE'
  | 'OTHER';
export type TechnicalAssetStatus = 'ACTIVE' | 'WARNING' | 'BROKEN' | 'DEPRECATED' | 'UNKNOWN';
export type TechnicalEnvironmentKind =
  | 'PRODUCTION'
  | 'STAGING'
  | 'DEVELOPMENT'
  | 'PREVIEW'
  | 'LEGACY';

export interface ProductTechnicalProfile {
  id: string;
  productId: string;
  technicalOwnerId: string | null;
  productionUrl: string | null;
  stagingUrl: string | null;
  repositoryUrl: string | null;
  deploymentMethod: string | null;
  hostingProvider: string | null;
  monitoringStatus: TechnicalHealthStatus;
  backupStatus: TechnicalBackupStatus;
  lastDeployAt: string | null;
  lastDeployStatus: TechnicalDeployStatus;
  technicalNotes: string | null;
}

export interface TechnicalAsset {
  id: string;
  type: TechnicalAssetType;
  name: string;
  provider: string | null;
  environment: TechnicalEnvironmentKind | null;
  status: TechnicalAssetStatus;
  url: string | null;
  credentialId: string | null;
  clientServiceRecordId: string | null;
  notes: string | null;
}

export interface TechnicalEnvironment {
  id: string;
  kind: TechnicalEnvironmentKind;
  name: string;
  url: string | null;
  branch: string | null;
  deploymentTarget: string | null;
  envCredentialId: string | null;
  databaseAssetId: string | null;
  status: TechnicalHealthStatus;
  lastCheckedAt: string | null;
}

export interface TechnicalReadiness {
  isReadyForTransfer: boolean;
  blockers: Array<{ code: string; label: string; message: string }>;
  summary: {
    environmentCount: number;
    assetCount: number;
    credentialLinkedCount: number;
    monitoringStatus: TechnicalHealthStatus;
    backupStatus: TechnicalBackupStatus;
  };
}

export interface TechnicalProductProfileResponse {
  profile: ProductTechnicalProfile;
  assets: TechnicalAsset[];
  environments: TechnicalEnvironment[];
  readiness: TechnicalReadiness;
}

export type UpdateTechnicalProfileData = Partial<ProductTechnicalProfile>;
export type CreateTechnicalAssetData = Partial<TechnicalAsset> & {
  name: string;
  type: TechnicalAssetType;
};
export type CreateTechnicalEnvironmentData = Partial<TechnicalEnvironment> & {
  name: string;
  kind: TechnicalEnvironmentKind;
};

export const technicalApi = {
  async getProductProfile(productId: string): Promise<TechnicalProductProfileResponse> {
    const resp = await api.get<TechnicalProductProfileResponse>(
      `/api/technical/products/${productId}/profile`,
    );
    return resp.data;
  },

  async updateProfile(productId: string, data: UpdateTechnicalProfileData) {
    const resp = await api.patch<TechnicalProductProfileResponse>(
      `/api/technical/products/${productId}/profile`,
      data,
    );
    return resp.data;
  },

  async createAsset(productId: string, data: CreateTechnicalAssetData) {
    const resp = await api.post<TechnicalProductProfileResponse>(
      `/api/technical/products/${productId}/assets`,
      data,
    );
    return resp.data;
  },

  async createEnvironment(productId: string, data: CreateTechnicalEnvironmentData) {
    const resp = await api.post<TechnicalProductProfileResponse>(
      `/api/technical/products/${productId}/environments`,
      data,
    );
    return resp.data;
  },
};
