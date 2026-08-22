import type { AiModelPolicyCandidateRole, AiModelPolicyMode } from '@nbos/shared';

export interface PolicyRouteModelSnapshot {
  providerModelId: string;
  status: string;
  connection: { id: string; status: string };
}

export interface PolicyRouteCandidateSnapshot {
  modelId: string;
  role: AiModelPolicyCandidateRole | string;
  priority: number;
  enabled: boolean;
  model: PolicyRouteModelSnapshot;
}

export interface PolicyRouteSnapshot {
  id: string;
  status: string;
  mode: AiModelPolicyMode | string;
  version: number;
  candidates: PolicyRouteCandidateSnapshot[];
}
