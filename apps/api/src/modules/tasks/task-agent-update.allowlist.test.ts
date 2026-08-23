import { describe, expect, it } from 'vitest';
import {
  isTaskAgentUpdateAllowedField,
  TASK_AGENT_UPDATE_ALLOWED_FIELDS,
  TASK_AGENT_UPDATE_FORBIDDEN_FIELDS,
} from './task-agent-update.allowlist';

describe('task agent update allowlist', () => {
  it('allows only business content fields from TasksService.update', () => {
    expect([...TASK_AGENT_UPDATE_ALLOWED_FIELDS]).toEqual([
      'title',
      'description',
      'priority',
      'dueDate',
    ]);
  });

  it('rejects workflow, assignment, scope and security fields', () => {
    for (const field of TASK_AGENT_UPDATE_FORBIDDEN_FIELDS) {
      expect(isTaskAgentUpdateAllowedField(field)).toBe(false);
    }
    expect(isTaskAgentUpdateAllowedField('status')).toBe(false);
    expect(isTaskAgentUpdateAllowedField('workspaceId')).toBe(false);
    expect(isTaskAgentUpdateAllowedField('creatorId')).toBe(false);
    expect(isTaskAgentUpdateAllowedField('completionRules')).toBe(false);
  });
});
