import type { InternalAiAgentStatus, InternalAiAgentSurface } from '@nbos/shared';

export interface InternalAiAgentSurfaceView {
  surface: InternalAiAgentSurface;
  enabled: boolean;
}

export interface InternalAiAgentView {
  id: string;
  name: string;
  description: string | null;
  status: InternalAiAgentStatus;
  ownerId: string;
  createdById: string;
  modelPolicyId: string | null;
  promptPolicyId: string | null;
  approvalPolicyId: string | null;
  environment: string | null;
  surfaces: InternalAiAgentSurfaceView[];
  createdAt: Date;
  updatedAt: Date;
}

export function toInternalAgentView(
  agent: Omit<InternalAiAgentView, 'surfaces'>,
  surfaces: InternalAiAgentSurfaceView[],
): InternalAiAgentView {
  return {
    id: agent.id,
    name: agent.name,
    description: agent.description,
    status: agent.status,
    ownerId: agent.ownerId,
    createdById: agent.createdById,
    modelPolicyId: agent.modelPolicyId,
    promptPolicyId: agent.promptPolicyId,
    approvalPolicyId: agent.approvalPolicyId,
    environment: agent.environment,
    surfaces,
    createdAt: agent.createdAt,
    updatedAt: agent.updatedAt,
  };
}
