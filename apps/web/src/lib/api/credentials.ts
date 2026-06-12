import { api } from '../api';
import type { AuditLogEntry } from './audit';

export interface CredentialManualGrant {
  employeeId: string;
  level: 'VIEW' | 'EDIT';
  expiresAt: string | null;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  grantedAt: string;
  grantedBy: { id: string; firstName: string; lastName: string } | null;
}

export interface CredentialSecretVersion {
  id: string;
  field: CredentialSecretField;
  versionNumber: number;
  rotatedAt: string;
  source: 'PLANNED' | 'MANUAL' | 'EMERGENCY';
  reason: string | null;
  rotatedBy: { id: string; firstName: string; lastName: string };
}

export interface CredentialsExportFileResult {
  format: string;
  filename: string;
  mimeType: string;
  contentBase64: string;
  count: number;
}

export interface CredentialSecretsPresent {
  password: boolean;
  passphrase: boolean;
  apiKey: boolean;
  envData: boolean;
  secureNotes: boolean;
}

export type CredentialSecretField = keyof CredentialSecretsPresent;

/** Detail / create / update: no secret blobs; use reveal/copy endpoints. */
export interface CredentialDetail {
  id: string;
  projectId: string | null;
  productId?: string | null;
  domainId?: string | null;
  clientServiceRecordId?: string | null;
  departmentId?: string | null;
  ownerId?: string | null;
  category: string;
  credentialType: string;
  criticality: string;
  providerId: string | null;
  provider: string | null;
  name: string;
  url: string | null;
  login: string | null;
  phone?: string | null;
  phones?: string[];
  appStorePlatform?: 'APPLE' | 'GOOGLE' | null;
  notes?: string | null;
  publicNotes?: string | null;
  /** Decrypted private comment (`secureNotes`); visible without step-up when user can view credential. */
  comment?: string | null;
  lastRotatedAt?: string | null;
  nextRotationAt?: string | null;
  rotationOwnerId?: string | null;
  accessLevel: string;
  allowedEmployees: string[];
  createdAt: string;
  updatedAt?: string;
  isFavorite?: boolean;
  folders?: { id: string; name: string; isPrimary: boolean }[];
  secretsPresent: CredentialSecretsPresent;
  /** Manual access grants, returned inline with detail to avoid a second round-trip. */
  manualGrants?: CredentialManualGrant[];
  health?: {
    status: 'HEALTHY' | 'DUE_SOON' | 'OVERDUE' | 'UNKNOWN';
    dueInDays: number | null;
    flags: string[];
  };
  project?: { id: string; code?: string; name: string } | null;
  department?: { id: string; name: string } | null;
  owner?: { id: string; firstName: string; lastName: string } | null;
}

interface ListData<T> {
  items: T[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
}

export interface CredentialProviderOption {
  id: string;
  name: string;
  slug: string;
  website: string | null;
}

export interface CredentialFolder {
  id: string;
  name: string;
  scope: string;
  projectId: string | null;
  parentId: string | null;
  sortOrder: number;
  credentialCount: number;
}

export interface CredentialProjectShell {
  id: string;
  name: string;
  code: string;
  credentialCount: number;
}

export const credentialsApi = {
  async searchProviders(query = '', limit = 20): Promise<CredentialProviderOption[]> {
    const resp = await api.get<CredentialProviderOption[]>('/api/credentials/providers', {
      params: { q: query.trim() || undefined, limit },
    });
    return resp.data;
  },
  async createProvider(body: {
    name: string;
    website?: string;
  }): Promise<CredentialProviderOption> {
    const resp = await api.post<CredentialProviderOption>('/api/credentials/providers', body);
    return resp.data;
  },
  async getAll(params?: Record<string, unknown>): Promise<ListData<CredentialDetail>> {
    const resp = await api.get<ListData<CredentialDetail>>('/api/credentials', { params });
    return resp.data;
  },
  /** Un-archive a credential (CREDENTIALS EDIT). */
  async restore(id: string): Promise<void> {
    await api.post(`/api/credentials/${id}/restore`, {});
  },
  async bulkArchive(credentialIds: string[]): Promise<{
    succeeded: number;
    skipped: number;
    credentialIds: string[];
  }> {
    const resp = await api.post<{
      succeeded: number;
      skipped: number;
      credentialIds: string[];
    }>('/api/credentials/bulk/archive', { credentialIds });
    return resp.data;
  },
  async bulkRestore(credentialIds: string[]): Promise<{
    succeeded: number;
    skipped: number;
    credentialIds: string[];
  }> {
    const resp = await api.post<{
      succeeded: number;
      skipped: number;
      credentialIds: string[];
    }>('/api/credentials/bulk/restore', { credentialIds });
    return resp.data;
  },
  async bulkAddToFolder(body: {
    credentialIds: string[];
    folderId: string;
  }): Promise<{ succeeded: number; skipped: number; credentialIds: string[] }> {
    const resp = await api.post<{
      succeeded: number;
      skipped: number;
      credentialIds: string[];
    }>('/api/credentials/bulk/folders/add', body);
    return resp.data;
  },
  async bulkRemoveFromFolder(body: {
    credentialIds: string[];
    folderId?: string;
  }): Promise<{ succeeded: number; skipped: number; credentialIds: string[] }> {
    const resp = await api.post<{
      succeeded: number;
      skipped: number;
      credentialIds: string[];
    }>('/api/credentials/bulk/folders/remove', body);
    return resp.data;
  },
  async getById(id: string): Promise<CredentialDetail> {
    const resp = await api.get<CredentialDetail>(`/api/credentials/${id}`);
    return resp.data;
  },
  async create(data: Record<string, unknown>): Promise<CredentialDetail> {
    const resp = await api.post<CredentialDetail>('/api/credentials', data);
    return resp.data;
  },
  async update(id: string, data: Record<string, unknown>): Promise<CredentialDetail> {
    const resp = await api.put<CredentialDetail>(`/api/credentials/${id}`, data);
    return resp.data;
  },
  async listFolders(params?: {
    scope?: string;
    parentId?: string | null;
    projectId?: string;
  }): Promise<{ folders: CredentialFolder[] }> {
    const resp = await api.get<{ folders: CredentialFolder[] }>('/api/credentials/folders', {
      params: {
        scope: params?.scope,
        projectId: params?.projectId,
        parentId:
          params?.parentId === null
            ? 'root'
            : params?.parentId !== undefined
              ? params.parentId
              : undefined,
      },
    });
    return resp.data;
  },
  async listProjectShells(): Promise<{ shells: CredentialProjectShell[] }> {
    const resp = await api.get<{ shells: CredentialProjectShell[] }>(
      '/api/credentials/project-shells',
    );
    return resp.data;
  },
  async createFolder(body: {
    name: string;
    scope: string;
    parentId?: string | null;
    projectId?: string | null;
  }): Promise<CredentialFolder> {
    const resp = await api.post<CredentialFolder>('/api/credentials/folders', body);
    return resp.data;
  },
  async updateFolder(id: string, body: { name: string }): Promise<CredentialFolder> {
    const resp = await api.put<CredentialFolder>(`/api/credentials/folders/${id}`, body);
    return resp.data;
  },
  async deleteFolder(id: string): Promise<void> {
    await api.delete(`/api/credentials/folders/${id}`);
  },
  async removeFolderGrouping(id: string): Promise<void> {
    await api.post(`/api/credentials/folders/${id}/remove-grouping`);
  },
  async replaceFolders(
    id: string,
    body: { folderIds?: string[]; folderId?: string | null },
  ): Promise<{ credentialId: string; folderIds: string[] }> {
    const resp = await api.put<{ credentialId: string; folderIds: string[] }>(
      `/api/credentials/${id}/folders`,
      body,
    );
    return resp.data;
  },
  async setFavorite(
    id: string,
    favorite: boolean,
  ): Promise<{ credentialId: string; isFavorite: boolean }> {
    const resp = await api.put<{ credentialId: string; isFavorite: boolean }>(
      `/api/credentials/${id}/favorite`,
      { favorite },
    );
    return resp.data;
  },
  async delete(id: string): Promise<void> {
    await api.delete(`/api/credentials/${id}`);
  },
  /** Remove archived row from DB (CREDENTIALS DELETE). */
  async permanentDelete(id: string, stepUpPassword?: string): Promise<void> {
    await api.delete(`/api/credentials/${id}/permanent`, {
      data: stepUpPassword ? { stepUpPassword } : {},
    });
  },
  async getVaultSession(): Promise<{ unlocked: boolean; expiresAt: string | null }> {
    const resp = await api.get<{ unlocked: boolean; expiresAt: string | null }>(
      '/api/credentials/vault-session',
    );
    return resp.data;
  },
  async unlockVault(password: string): Promise<{ unlocked: boolean; expiresAt: string | null }> {
    const resp = await api.post<{ unlocked: boolean; expiresAt: string | null }>(
      '/api/credentials/vault-unlock',
      { password },
    );
    return resp.data;
  },
  async lockVault(): Promise<void> {
    await api.post('/api/credentials/vault-lock', {});
  },
  async revealSecret(
    id: string,
    field: CredentialSecretField,
    stepUpPassword?: string,
  ): Promise<{ field: CredentialSecretField; value: string }> {
    const resp = await api.post<{ field: CredentialSecretField; value: string }>(
      `/api/credentials/${id}/secrets/reveal`,
      stepUpPassword ? { field, stepUpPassword } : { field },
    );
    return resp.data;
  },
  async copySecret(
    id: string,
    field: CredentialSecretField,
    stepUpPassword?: string,
  ): Promise<{ field: CredentialSecretField; value: string }> {
    const resp = await api.post<{ field: CredentialSecretField; value: string }>(
      `/api/credentials/${id}/secrets/copy`,
      stepUpPassword ? { field, stepUpPassword } : { field },
    );
    return resp.data;
  },
  /** Audits `credential.url_opened`; returns safe http(s) URL for navigation. */
  async recordUrlOpened(id: string): Promise<{ url: string }> {
    const resp = await api.post<{ url: string }>(`/api/credentials/${id}/open-url`, {});
    return resp.data;
  },
  async getManualAccess(id: string): Promise<{ grants: CredentialManualGrant[] }> {
    const resp = await api.get<{ grants: CredentialManualGrant[] }>(
      `/api/credentials/${id}/manual-access`,
    );
    return resp.data;
  },
  async replaceManualAccess(
    id: string,
    grants: { employeeId: string; level: 'VIEW' | 'EDIT'; expiresAt?: string | null }[],
  ): Promise<{ grants: CredentialManualGrant[] }> {
    const resp = await api.put<{ grants: CredentialManualGrant[] }>(
      `/api/credentials/${id}/manual-access`,
      { grants },
    );
    return resp.data;
  },
  async getAuditLog(
    id: string,
    params?: { page?: number; pageSize?: number },
  ): Promise<{ items: AuditLogEntry[]; meta: { total: number; page: number; pageSize: number } }> {
    const resp = await api.get<{
      items: AuditLogEntry[];
      meta: { total: number; page: number; pageSize: number };
    }>(`/api/credentials/${id}/audit-log`, { params });
    return resp.data;
  },
  async exportEncryptedFile(body: {
    credentialIds?: string[];
    fields?: string[];
    stepUpPassword: string;
  }): Promise<CredentialsExportFileResult> {
    const resp = await api.post<CredentialsExportFileResult>('/api/credentials/export/file', body);
    return resp.data;
  },
  async grantEmergencyAccess(
    id: string,
    body: { reason: string; stepUpPassword: string },
  ): Promise<{ credentialId: string; expiresAt: string; level: 'VIEW' }> {
    const resp = await api.post<{ credentialId: string; expiresAt: string; level: 'VIEW' }>(
      `/api/credentials/${id}/emergency-access`,
      body,
    );
    return resp.data;
  },
  async getSecretVersions(id: string): Promise<{ items: CredentialSecretVersion[] }> {
    const resp = await api.get<{ items: CredentialSecretVersion[] }>(
      `/api/credentials/${id}/secret-versions`,
    );
    return resp.data;
  },
  async revealSecretVersion(
    id: string,
    versionId: string,
    stepUpPassword?: string,
  ): Promise<{ field: CredentialSecretField; versionNumber: number; value: string }> {
    const resp = await api.post<{
      field: CredentialSecretField;
      versionNumber: number;
      value: string;
    }>(
      `/api/credentials/${id}/secret-versions/${versionId}/reveal`,
      stepUpPassword ? { stepUpPassword } : {},
    );
    return resp.data;
  },
};
