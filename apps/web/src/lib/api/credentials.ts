import { api } from '../api';

export interface CredentialSecretsPresent {
  password: boolean;
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
  environment: string | null;
  provider: string | null;
  name: string;
  url: string | null;
  login: string | null;
  phone?: string | null;
  notes?: string | null;
  publicNotes?: string | null;
  lastRotatedAt?: string | null;
  nextRotationAt?: string | null;
  rotationOwnerId?: string | null;
  accessLevel: string;
  allowedEmployees: string[];
  createdAt: string;
  updatedAt?: string;
  secretsPresent: CredentialSecretsPresent;
  project?: { id: string; code?: string; name: string } | null;
  department?: { id: string; name: string } | null;
  owner?: { id: string; firstName: string; lastName: string } | null;
}

interface ListData<T> {
  items: T[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
}

export const credentialsApi = {
  async getAll(params?: Record<string, unknown>): Promise<ListData<CredentialDetail>> {
    const resp = await api.get<ListData<CredentialDetail>>('/api/credentials', { params });
    return resp.data;
  },
  /** Un-archive a credential (CREDENTIALS EDIT). */
  async restore(id: string): Promise<void> {
    await api.post(`/api/credentials/${id}/restore`, {});
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
  async delete(id: string): Promise<void> {
    await api.delete(`/api/credentials/${id}`);
  },
  /** Remove archived row from DB (CREDENTIALS DELETE). */
  async permanentDelete(id: string): Promise<void> {
    await api.delete(`/api/credentials/${id}/permanent`);
  },
  async revealSecret(
    id: string,
    field: CredentialSecretField,
  ): Promise<{ field: CredentialSecretField; value: string }> {
    const resp = await api.post<{ field: CredentialSecretField; value: string }>(
      `/api/credentials/${id}/secrets/reveal`,
      { field },
    );
    return resp.data;
  },
  async copySecret(
    id: string,
    field: CredentialSecretField,
  ): Promise<{ field: CredentialSecretField; value: string }> {
    const resp = await api.post<{ field: CredentialSecretField; value: string }>(
      `/api/credentials/${id}/secrets/copy`,
      { field },
    );
    return resp.data;
  },
  /** Audits `credential.url_opened`; returns safe http(s) URL for navigation. */
  async recordUrlOpened(id: string): Promise<{ url: string }> {
    const resp = await api.post<{ url: string }>(`/api/credentials/${id}/open-url`, {});
    return resp.data;
  },
};
