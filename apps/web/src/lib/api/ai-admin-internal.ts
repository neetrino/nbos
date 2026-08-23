import { api } from '../api';
import type { AgentCapabilityGrantView, AgentResourceScopeView } from './ai-admin';

export const aiAdminInternalApi = {
  grantCapability: (agentId: string, capabilityKey: string) =>
    post<AgentCapabilityGrantView>(`/api/ai-admin/internal-agents/${agentId}/capabilities`, {
      capabilityKey,
    }),
  revokeCapability: (agentId: string, capabilityKey: string) =>
    del(
      `/api/ai-admin/internal-agents/${agentId}/capabilities/${encodeURIComponent(capabilityKey)}`,
    ),
  listCapabilities: (agentId: string) =>
    get<AgentCapabilityGrantView[]>(`/api/ai-admin/internal-agents/${agentId}/capabilities`),
  listScopes: (agentId: string) =>
    get<AgentResourceScopeView[]>(`/api/ai-admin/internal-agents/${agentId}/scopes`),
  grantWorkspaceScope: (agentId: string, workspaceId: string) =>
    post<AgentResourceScopeView>(`/api/ai-admin/internal-agents/${agentId}/scopes`, {
      scopeType: 'WORKSPACE',
      scopeId: workspaceId,
    }),
  revokeScope: (agentId: string, scopeId: string) =>
    del(`/api/ai-admin/internal-agents/${agentId}/scopes/${scopeId}`),
};

async function get<T>(url: string): Promise<T> {
  const resp = await api.get<T>(url);
  return resp.data;
}

async function post<T>(url: string, body: unknown): Promise<T> {
  const resp = await api.post<T>(url, body);
  return resp.data;
}

async function del(url: string): Promise<void> {
  await api.delete(url);
}
