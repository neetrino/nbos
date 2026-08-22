import { jsonContainsSecretShapedFields } from './context-classification';
import type { AiExecutionRecord } from './execution-types';

const EXECUTION_FORBIDDEN_KEYS = [
  'prompt',
  'completion',
  'messages',
  'systemPrompt',
  'inputText',
  'outputText',
] as const;

export type AiExecutionSafetyIssue = {
  code: 'SECRET_SHAPED_FIELD' | 'PROMPT_BODY_FIELD';
  field: string;
};

/**
 * Metrics rows must never become a second prompt/secret store.
 * Callers persist only the typed `AiExecutionRecord` fields.
 */
export function findExecutionRecordSafetyIssues(value: unknown): AiExecutionSafetyIssue[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return [];
  }
  const record = value as Record<string, unknown>;
  const issues: AiExecutionSafetyIssue[] = [];
  for (const key of Object.keys(record)) {
    if ((EXECUTION_FORBIDDEN_KEYS as readonly string[]).includes(key)) {
      issues.push({ code: 'PROMPT_BODY_FIELD', field: key });
    }
  }
  if (jsonContainsSecretShapedFields(value)) {
    issues.push({ code: 'SECRET_SHAPED_FIELD', field: '*' });
  }
  return issues;
}

export function assertExecutionRecordSafe(record: AiExecutionRecord): void {
  const issues = findExecutionRecordSafetyIssues(record);
  if (issues.length > 0) {
    throw new Error(`AI execution record is not metrics-safe: ${issues[0]?.code ?? 'UNKNOWN'}`);
  }
}
