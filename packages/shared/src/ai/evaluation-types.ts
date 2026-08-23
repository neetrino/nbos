export const AI_MODEL_EVALUATION_STATUSES = [
  'NOT_EVALUATED',
  'PENDING',
  'EVALUATED',
  'UNSUITABLE',
] as const;

export type AiModelEvaluationStatus = (typeof AI_MODEL_EVALUATION_STATUSES)[number];

export const AI_EVALUATION_SUITE_STATUSES = ['DRAFT', 'ACTIVE', 'RETIRED'] as const;

export type AiEvaluationSuiteStatus = (typeof AI_EVALUATION_SUITE_STATUSES)[number];

export const AI_EVALUATION_RUN_STATUSES = [
  'PENDING',
  'RUNNING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
] as const;

export type AiEvaluationRunStatus = (typeof AI_EVALUATION_RUN_STATUSES)[number];

/**
 * Grading kinds stay separable. A run records exactly one kind so an LLM judge
 * cannot be mixed into a deterministic or human score.
 */
export const AI_EVALUATION_GRADING_KINDS = ['DETERMINISTIC', 'HUMAN', 'MODEL_BASED'] as const;

export type AiEvaluationGradingKind = (typeof AI_EVALUATION_GRADING_KINDS)[number];

export function isAiModelEvaluationStatus(value: string): value is AiModelEvaluationStatus {
  return (AI_MODEL_EVALUATION_STATUSES as readonly string[]).includes(value);
}

export function isAiEvaluationGradingKind(value: string): value is AiEvaluationGradingKind {
  return (AI_EVALUATION_GRADING_KINDS as readonly string[]).includes(value);
}

export interface AiEvaluationDatasetRef {
  id: string;
  suiteId: string;
  name: string;
  version: number;
  identityKey: string;
}

export interface AiEvaluationSuiteRecord {
  id: string;
  name: string;
  purpose: string | null;
  status: AiEvaluationSuiteStatus;
  domainModule: string | null;
  gradingKinds: readonly AiEvaluationGradingKind[];
}

export interface AiEvaluationRunRecord {
  id: string;
  suiteId: string;
  datasetId: string;
  modelId: string | null;
  modelPolicyId: string | null;
  promptVersionId: string | null;
  status: AiEvaluationRunStatus;
  gradingKind: AiEvaluationGradingKind;
  qualityScore: string | null;
  latencyMsAvg: number | null;
  estimatedCost: string | null;
  currency: string | null;
  sampleCount: number | null;
  reviewerEmployeeId: string | null;
  notes: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
}
