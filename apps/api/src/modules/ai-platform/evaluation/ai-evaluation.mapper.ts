import type {
  AiEvaluationDatasetRef,
  AiEvaluationGradingKind,
  AiEvaluationRunRecord,
  AiEvaluationRunStatus,
  AiEvaluationSuiteRecord,
} from '@nbos/shared';

export function toEvaluationSuiteView(row: {
  id: string;
  name: string;
  purpose: string | null;
  status: AiEvaluationSuiteRecord['status'];
  domainModule: string | null;
  gradingKinds: AiEvaluationGradingKind[];
}): AiEvaluationSuiteRecord {
  return {
    id: row.id,
    name: row.name,
    purpose: row.purpose,
    status: row.status,
    domainModule: row.domainModule,
    gradingKinds: row.gradingKinds,
  };
}

export function toEvaluationDatasetView(row: {
  id: string;
  suiteId: string;
  name: string;
  version: number;
  identityKey: string;
}): AiEvaluationDatasetRef {
  return {
    id: row.id,
    suiteId: row.suiteId,
    name: row.name,
    version: row.version,
    identityKey: row.identityKey,
  };
}

export function toEvaluationRunView(row: {
  id: string;
  suiteId: string;
  datasetId: string;
  modelId: string | null;
  modelPolicyId: string | null;
  promptVersionId: string | null;
  status: AiEvaluationRunStatus;
  gradingKind: AiEvaluationGradingKind;
  qualityScore: { toString(): string } | null;
  latencyMsAvg: number | null;
  estimatedCost: { toString(): string } | null;
  currency: string | null;
  sampleCount: number | null;
  reviewerEmployeeId: string | null;
  notes: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
}): AiEvaluationRunRecord {
  return {
    id: row.id,
    suiteId: row.suiteId,
    datasetId: row.datasetId,
    modelId: row.modelId,
    modelPolicyId: row.modelPolicyId,
    promptVersionId: row.promptVersionId,
    status: row.status,
    gradingKind: row.gradingKind,
    qualityScore: row.qualityScore?.toString() ?? null,
    latencyMsAvg: row.latencyMsAvg,
    estimatedCost: row.estimatedCost?.toString() ?? null,
    currency: row.currency,
    sampleCount: row.sampleCount,
    reviewerEmployeeId: row.reviewerEmployeeId,
    notes: row.notes,
    startedAt: row.startedAt,
    completedAt: row.completedAt,
  };
}
