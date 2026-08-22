import type { InternalAiAgentStatus, InternalAiAgentSurface } from '@nbos/shared';
import { normalizeAgentDescription, requireAgentName } from '../agents/external-agent.rules';

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

export interface InternalAgentUpdateFields {
  name?: string;
  description?: string | null;
  ownerId?: string;
  environment?: string | null;
  modelPolicyId?: string | null;
  promptPolicyId?: string | null;
  approvalPolicyId?: string | null;
}

export function toInternalAgentUpdateData(input: InternalAgentUpdateFields) {
  return {
    ...(input.name === undefined ? {} : { name: requireAgentName(input.name) }),
    ...(input.description === undefined
      ? {}
      : { description: normalizeAgentDescription(input.description) }),
    ...(input.ownerId === undefined ? {} : { ownerId: input.ownerId }),
    ...(input.environment === undefined
      ? {}
      : { environment: normalizeAgentDescription(input.environment) }),
    ...(input.modelPolicyId === undefined ? {} : { modelPolicyId: input.modelPolicyId }),
    ...(input.promptPolicyId === undefined ? {} : { promptPolicyId: input.promptPolicyId }),
    ...(input.approvalPolicyId === undefined ? {} : { approvalPolicyId: input.approvalPolicyId }),
  };
}

export function toSurfaceViews(
  surfaces: Array<{ surface: InternalAiAgentSurface; enabled: boolean }>,
): InternalAiAgentSurfaceView[] {
  return surfaces.map((item) => ({ surface: item.surface, enabled: item.enabled }));
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
