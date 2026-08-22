import {
  adminDelete,
  adminGet,
  adminPatch,
  adminPost,
  validateReplacementProvider,
  type AiAdminActivityPage,
} from './ai-admin-http';

export type ExternalAgentState = 'ACTIVE' | 'DISABLED' | 'REVOKED' | 'EXPIRED';
export type AiCredentialState = 'ACTIVE' | 'REVOKED' | 'EXPIRED';

export interface ExternalAgentView {
  id: string;
  name: string;
  description: string | null;
  state: ExternalAgentState;
  ownerId: string;
  createdById: string;
  expiresAt: string | null;
  revokedAt: string | null;
  lastUsedAt: string | null;
  lastUsedIp: string | null;
  lastUsedChannel: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgentCredentialView {
  id: string;
  agentId: string;
  keyId: string;
  tokenPrefix: string;
  label: string | null;
  state: AiCredentialState;
  expiresAt: string | null;
  revokedAt: string | null;
  lastUsedAt: string | null;
  rotatedFromId: string | null;
  createdAt: string;
}

export interface IssuedAgentCredential {
  credential: AgentCredentialView;
  token: string;
}

export interface AgentCapabilityGrantView {
  id: string;
  agentId: string;
  capabilityKey: string;
  reason: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

export interface AgentResourceScopeView {
  id: string;
  agentId: string;
  scopeType: string;
  scopeId: string;
  resourceType: string | null;
  reason: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

export interface ExternalAgentBundle {
  agent: ExternalAgentView;
  capabilities: AgentCapabilityGrantView[];
  scopes: AgentResourceScopeView[];
  credentials: AgentCredentialView[];
}

export interface AiProviderConnectionView {
  id: string;
  provider: 'OPENAI' | 'ANTHROPIC';
  name: string;
  status: 'ACTIVE' | 'DISABLED' | 'REVOKED';
  keyPrefix: string;
  providerOrganizationId: string | null;
  providerProjectId: string | null;
  baseUrl: string | null;
  lastValidatedAt: string | null;
  lastModelSyncAt: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiModelView {
  id: string;
  connectionId: string;
  provider: 'OPENAI' | 'ANTHROPIC';
  providerModelId: string;
  displayName: string;
  status: 'DISCOVERED' | 'ACTIVE' | 'DISABLED' | 'DEPRECATED' | 'UNAVAILABLE';
  discoveredAt: string;
  lastSeenAt: string;
  providerMetadata: Record<string, unknown>;
  suitabilityTags: string[];
  notes: string | null;
  aliasOf: string | null;
  snapshotId: string | null;
  activatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AiModelPolicyCandidateView {
  id: string;
  modelId: string;
  role: string;
  priority: number;
  enabled: boolean;
}

export interface AiModelPolicyView {
  id: string;
  name: string;
  purpose: string | null;
  mode: 'FIXED' | 'PRIMARY_FALLBACK';
  status: string;
  version: number;
  createdById: string;
  candidates: AiModelPolicyCandidateView[];
  createdAt: string;
  updatedAt: string;
}

export interface InternalAiAgentView {
  id: string;
  name: string;
  description: string | null;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'DISABLED' | 'ARCHIVED';
  ownerId: string;
  createdById: string;
  modelPolicyId: string | null;
  promptPolicyId: string | null;
  approvalPolicyId: string | null;
  environment: string | null;
  surfaces: Array<{ surface: string; enabled: boolean }>;
  createdAt: string;
  updatedAt: string;
}

export interface AiAdminOverview {
  externalAgents: {
    total: number;
    active: number;
    disabled: number;
    revoked: number;
    expired: number;
  };
  providers: { total: number; active: number; disabled: number; revoked: number };
  modelPolicies: { total: number; active: number; disabled: number };
  attention: Array<{ kind: string; id: string; name: string; reason: string }>;
  pendingApprovals: number;
  recentActivity: unknown[];
}

export interface AiCapabilityCatalogItem {
  key: string;
  description: string;
  access: string;
  risk: string;
  allowedScopeTypes: string[];
}

export interface AiAdminDisableImpact {
  kind: 'model' | 'policy' | 'provider';
  id: string;
  policies: Array<{ id: string; name: string; status: string }>;
  agents: Array<{ id: string; name: string; status: string }>;
}

export interface WorkspaceAccessRow {
  workspaceId: string;
  scope: AgentResourceScopeView;
  agent: ExternalAgentView | null;
  capabilities: AgentCapabilityGrantView[];
}

export const aiAdminApi = {
  getDisableImpact: (kind: 'model' | 'policy' | 'provider', id: string) =>
    get<AiAdminDisableImpact>('/api/ai-admin/disable-impact', { kind, id }),
  overview: () => get<AiAdminOverview>('/api/ai-admin/overview'),
  capabilities: () => get<AiCapabilityCatalogItem[]>('/api/ai-admin/capabilities'),
  activity: (params?: { page?: number; pageSize?: number }) =>
    get<AiAdminActivityPage>('/api/ai-admin/activity', params),

  listExternalAgents: () => get<ExternalAgentBundle[]>('/api/ai-admin/external-agents'),
  getExternalAgent: (id: string) => get<ExternalAgentBundle>(`/api/ai-admin/external-agents/${id}`),
  createExternalAgent: (body: { name: string; description?: string; expiresAt?: string }) =>
    post<ExternalAgentView>('/api/ai-admin/external-agents', body),
  updateExternalAgent: (id: string, body: Record<string, unknown>) =>
    patch<ExternalAgentView>(`/api/ai-admin/external-agents/${id}`, body),
  disableExternalAgent: (id: string) =>
    post<ExternalAgentView>(`/api/ai-admin/external-agents/${id}/disable`),
  enableExternalAgent: (id: string) =>
    post<ExternalAgentView>(`/api/ai-admin/external-agents/${id}/enable`),
  revokeExternalAgent: (id: string) =>
    post<ExternalAgentView>(`/api/ai-admin/external-agents/${id}/revoke`),
  getExternalAgentActivity: (id: string, params?: { page?: number; pageSize?: number }) =>
    get<AiAdminActivityPage>(`/api/ai-admin/external-agents/${id}/activity`, params),

  issueCredential: (agentId: string, body: { label?: string; expiresAt?: string } = {}) =>
    post<IssuedAgentCredential>(`/api/ai-admin/external-agents/${agentId}/credentials`, body),
  rotateCredential: (agentId: string, credentialId: string, body: Record<string, unknown> = {}) =>
    post<IssuedAgentCredential>(
      `/api/ai-admin/external-agents/${agentId}/credentials/${credentialId}/rotate`,
      body,
    ),
  revokeCredential: (agentId: string, credentialId: string) =>
    post<AgentCredentialView>(
      `/api/ai-admin/external-agents/${agentId}/credentials/${credentialId}/revoke`,
    ),
  grantCapability: (agentId: string, capabilityKey: string) =>
    post<AgentCapabilityGrantView>(`/api/ai-admin/external-agents/${agentId}/capabilities`, {
      capabilityKey,
    }),
  revokeCapability: (agentId: string, capabilityKey: string) =>
    del(
      `/api/ai-admin/external-agents/${agentId}/capabilities/${encodeURIComponent(capabilityKey)}`,
    ),
  grantWorkspaceScope: (agentId: string, workspaceId: string) =>
    post<AgentResourceScopeView>(`/api/ai-admin/external-agents/${agentId}/scopes`, {
      scopeType: 'WORKSPACE',
      scopeId: workspaceId,
    }),
  revokeScope: (agentId: string, scopeId: string) =>
    del(`/api/ai-admin/external-agents/${agentId}/scopes/${scopeId}`),

  listWorkspaceAccess: (workspaceId: string) =>
    get<WorkspaceAccessRow[]>(`/api/ai-admin/workspaces/${workspaceId}/access`),
  grantWorkspaceAccess: (workspaceId: string, agentId: string) =>
    post<AgentResourceScopeView>(`/api/ai-admin/workspaces/${workspaceId}/access`, { agentId }),
  revokeWorkspaceAccess: (workspaceId: string, scopeId: string) =>
    del(`/api/ai-admin/workspaces/${workspaceId}/access/${scopeId}`),
  listProviders: () => get<AiProviderConnectionView[]>('/api/ai-admin/providers'),
  validateDraftProvider: (body: {
    provider: 'OPENAI' | 'ANTHROPIC';
    apiKey: string;
    baseUrl?: string;
  }) =>
    post<{ ok: boolean; errorCode?: string | null }>(
      '/api/ai-admin/providers/validate-draft',
      body,
    ),
  createProvider: (body: {
    provider: 'OPENAI' | 'ANTHROPIC';
    name: string;
    apiKey: string;
    baseUrl?: string;
  }) => post<AiProviderConnectionView>('/api/ai-admin/providers', body),
  validateProvider: (id: string) =>
    post<{ connection: AiProviderConnectionView; result: { ok: boolean; errorCode?: string } }>(
      `/api/ai-admin/providers/${id}/validate`,
    ),
  validateReplacementProvider,
  rotateProviderKey: (id: string, apiKey: string) =>
    post<AiProviderConnectionView>(`/api/ai-admin/providers/${id}/rotate`, { apiKey }),
  disableProvider: (id: string) =>
    post<AiProviderConnectionView>(`/api/ai-admin/providers/${id}/disable`),
  enableProvider: (id: string) =>
    post<AiProviderConnectionView>(`/api/ai-admin/providers/${id}/enable`),
  revokeProvider: (id: string) =>
    post<AiProviderConnectionView>(`/api/ai-admin/providers/${id}/revoke`),
  syncProviderModels: (id: string) => post<unknown>(`/api/ai-admin/providers/${id}/sync-models`),
  listModels: (params?: { connectionId?: string; status?: string }) =>
    get<AiModelView[]>('/api/ai-admin/models', params),
  activateModel: (id: string) => post<AiModelView>(`/api/ai-admin/models/${id}/activate`),
  disableModel: (id: string) => post<AiModelView>(`/api/ai-admin/models/${id}/disable`),
  updateModel: (id: string, body: { suitabilityTags?: string[]; notes?: string | null }) =>
    patch<AiModelView>(`/api/ai-admin/models/${id}`, body),
  listPolicies: () => get<AiModelPolicyView[]>('/api/ai-admin/model-policies'),
  createPolicy: (body: {
    name: string;
    purpose?: string;
    mode: 'FIXED' | 'PRIMARY_FALLBACK';
    candidates: Array<{ modelId: string; role: string; priority: number; enabled?: boolean }>;
  }) => post<AiModelPolicyView>('/api/ai-admin/model-policies', body),
  replacePolicyCandidates: (
    id: string,
    candidates: Array<{ modelId: string; role: string; priority: number; enabled?: boolean }>,
  ) => post<AiModelPolicyView>(`/api/ai-admin/model-policies/${id}/candidates`, { candidates }),
  activatePolicy: (id: string) =>
    post<AiModelPolicyView>(`/api/ai-admin/model-policies/${id}/activate`),
  disablePolicy: (id: string) =>
    post<AiModelPolicyView>(`/api/ai-admin/model-policies/${id}/disable`),
  listInternalAgents: () => get<InternalAiAgentView[]>('/api/ai-admin/internal-agents'),
  getInternalAgent: (id: string) => get<InternalAiAgentView>(`/api/ai-admin/internal-agents/${id}`),
  createInternalAgent: (body: { name: string; description?: string }) =>
    post<InternalAiAgentView>('/api/ai-admin/internal-agents', body),
  updateInternalAgent: (id: string, body: Record<string, unknown>) =>
    patch<InternalAiAgentView>(`/api/ai-admin/internal-agents/${id}`, body),
  activateInternalAgent: (id: string) =>
    post<InternalAiAgentView>(`/api/ai-admin/internal-agents/${id}/activate`),
  pauseInternalAgent: (id: string) =>
    post<InternalAiAgentView>(`/api/ai-admin/internal-agents/${id}/pause`),
  disableInternalAgent: (id: string) =>
    post<InternalAiAgentView>(`/api/ai-admin/internal-agents/${id}/disable`),
  archiveInternalAgent: (id: string) =>
    post<InternalAiAgentView>(`/api/ai-admin/internal-agents/${id}/archive`),
};

const get = adminGet;
const post = adminPost;
const patch = adminPatch;
const del = adminDelete;
