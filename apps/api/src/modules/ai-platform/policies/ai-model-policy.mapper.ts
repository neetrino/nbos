import type {
  AiModelPolicyCandidateRole,
  AiModelPolicyMode,
  AiModelPolicyStatus,
} from '@nbos/shared';

export interface AiModelPolicyCandidateView {
  id: string;
  modelId: string;
  role: AiModelPolicyCandidateRole;
  priority: number;
  enabled: boolean;
}

export interface AiModelPolicyView {
  id: string;
  name: string;
  purpose: string | null;
  mode: AiModelPolicyMode;
  status: AiModelPolicyStatus;
  version: number;
  createdById: string;
  candidates: AiModelPolicyCandidateView[];
  createdAt: Date;
  updatedAt: Date;
}

export function toModelPolicyView(
  policy: Omit<AiModelPolicyView, 'candidates'>,
  candidates: AiModelPolicyCandidateView[],
): AiModelPolicyView {
  return {
    id: policy.id,
    name: policy.name,
    purpose: policy.purpose,
    mode: policy.mode,
    status: policy.status,
    version: policy.version,
    createdById: policy.createdById,
    candidates: [...candidates].sort((left, right) => left.priority - right.priority),
    createdAt: policy.createdAt,
    updatedAt: policy.updatedAt,
  };
}
