import type { AiEvaluationRunStatus } from './evaluation-types';

export const AI_EVALUATION_RUN_TRANSITIONS: Record<
  AiEvaluationRunStatus,
  readonly AiEvaluationRunStatus[]
> = {
  PENDING: ['RUNNING', 'CANCELLED'],
  RUNNING: ['COMPLETED', 'FAILED', 'CANCELLED'],
  COMPLETED: [],
  FAILED: [],
  CANCELLED: [],
};

export function canTransitionEvaluationRun(
  from: AiEvaluationRunStatus,
  to: AiEvaluationRunStatus,
): boolean {
  return AI_EVALUATION_RUN_TRANSITIONS[from].includes(to);
}

/**
 * Evaluation never activates a model. Catalog status stays an explicit admin
 * action; an LLM-judge score is only a supporting signal on its own run.
 */
export function evaluationScoreMayAutoActivateModel(): false {
  return false;
}
