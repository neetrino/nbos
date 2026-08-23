import type { TaskCreatedByActor } from './task-create.input';

/**
 * Stable producer identities for trusted internal Task creates.
 * These are not Employee ids — accountable staff stay on `creatorId`.
 */
export const TASK_CREATION_PRODUCER = {
  support: 'support',
  automation: 'auto-tasks',
} as const;

/** Support ticket → Task. Actor is the Support producer, not a fake employee. */
export function supportTaskCreationActor(ticketId: string): TaskCreatedByActor {
  return { type: 'SYSTEM', id: `${TASK_CREATION_PRODUCER.support}:${ticketId}` };
}

/** Blueprint/automation pack → Task. Actor is AutoTasks, not a fake employee. */
export function automationTaskCreationActor(linkType: string, linkId: string): TaskCreatedByActor {
  return {
    type: 'AUTOMATION',
    id: `${TASK_CREATION_PRODUCER.automation}:${linkType}:${linkId}`,
  };
}
