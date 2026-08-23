import { describe, expect, it } from 'vitest';
import {
  automationTaskCreationActor,
  supportTaskCreationActor,
  TASK_CREATION_PRODUCER,
} from './task-creation-actors';

describe('task-creation-actors', () => {
  it('names Support as a SYSTEM producer keyed by ticket, not an employee', () => {
    expect(supportTaskCreationActor('ticket-1')).toEqual({
      type: 'SYSTEM',
      id: `${TASK_CREATION_PRODUCER.support}:ticket-1`,
    });
  });

  it('names AutoTasks as an AUTOMATION producer keyed by the source link', () => {
    expect(automationTaskCreationActor('DEAL', 'deal-9')).toEqual({
      type: 'AUTOMATION',
      id: `${TASK_CREATION_PRODUCER.automation}:DEAL:deal-9`,
    });
  });
});
