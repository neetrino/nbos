import { AgentAccessException } from '../auth/agent-auth.errors';
import {
  AGENT_TASK_PRIORITIES,
  AGENT_TASK_SORT_FIELDS,
  AGENT_TASK_STATUSES,
} from './agent-capability.constants';
import { readOptionalString, readRequiredString } from './agent-capability.input';

const TASK_STATUSES: ReadonlySet<string> = new Set(AGENT_TASK_STATUSES);
const TASK_PRIORITIES: ReadonlySet<string> = new Set(AGENT_TASK_PRIORITIES);

export function readOptionalTaskStatus(
  input: Record<string, unknown>,
  field = 'status',
): string | undefined {
  const value = readOptionalString(input, field);
  if (!value) return undefined;
  if (!TASK_STATUSES.has(value)) {
    throw AgentAccessException.validationFailed(`${field} is invalid`);
  }
  return value;
}

export function readOptionalTaskPriority(
  input: Record<string, unknown>,
  field = 'priority',
): string | undefined {
  const value = readOptionalString(input, field);
  if (!value) return undefined;
  if (!TASK_PRIORITIES.has(value)) {
    throw AgentAccessException.validationFailed(`${field} is invalid`);
  }
  return value;
}

export function readRequiredIsoDateTime(input: Record<string, unknown>, field: string): Date {
  const raw = readRequiredString(input, field);
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString() !== raw) {
    throw AgentAccessException.validationFailed(`${field} must be an ISO-8601 timestamp`);
  }
  return parsed;
}

export function readOptionalIsoDate(
  input: Record<string, unknown>,
  field: string,
): string | undefined {
  const value = readOptionalString(input, field);
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw AgentAccessException.validationFailed(`${field} must be a valid date`);
  }
  return value;
}

export function readOptionalSortBy(input: Record<string, unknown>): string | undefined {
  const value = readOptionalString(input, 'sortBy');
  if (!value) return undefined;
  if (!(AGENT_TASK_SORT_FIELDS as readonly string[]).includes(value)) {
    throw AgentAccessException.validationFailed('sortBy is invalid');
  }
  return value;
}
