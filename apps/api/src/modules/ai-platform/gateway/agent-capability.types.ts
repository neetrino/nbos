import type { AuthenticatedAgent } from '../auth/agent-authenticator.service';

export interface AgentCapabilityInvocation {
  agent: AuthenticatedAgent;
  capabilityKey: string;
  input: Record<string, unknown>;
  /** REST `Idempotency-Key` or MCP `clientOperationId`. */
  idempotencyKey?: string | null;
  /** Binary payload for `tasks.attach_artifact`. Not a JSON input field. */
  payload?: { bytes: Uint8Array } | null;
}

export interface AgentCapabilityResult {
  capabilityKey: string;
  data: unknown;
}

export interface AgentTaskProjection {
  id: string;
  code: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  workspaceId: string | null;
  sprintId: string | null;
  updatedAt: string | null;
  reviewRequestedAt?: string | null;
}

export interface AgentWorkspaceProjection {
  id: string;
  name: string;
  type: string;
  projectId: string | null;
  productId: string | null;
  scrumEnabled: boolean;
}

export interface AgentTaskLinkProjection {
  linkType: string;
  entityType: string;
  entityId: string;
}
