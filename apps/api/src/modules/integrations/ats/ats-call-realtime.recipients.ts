import { conversationAnchor } from '../../crm/calls/call-conversation';
import type { CallLifecycleEmployees } from './ats-call-realtime.target';

const PARTICIPANT_FIELDS = [
  'initiatedByEmployeeId',
  'answeredEmployeeId',
  'responsibleEmployeeId',
] as const satisfies ReadonlyArray<keyof CallLifecycleEmployees>;

export type ConversationLifecycleRow = CallLifecycleEmployees & {
  id: string;
  createdAt: Date;
};

export type FinishedRecipient<T extends ConversationLifecycleRow> = {
  employeeId: string;
  call: T;
};

/** Connection the employee is on. SSE must not cite a sibling they cannot open. */
export function accessibleConnection<T extends ConversationLifecycleRow>(
  members: readonly T[],
  employeeId: string,
): T | null {
  return conversationAnchor(members.filter((member) => employeeOwnsConnection(member, employeeId)));
}

/**
 * `call.finished` goes to every participant on the conversation.
 * The triggering leg may be the customer connection after the employee already hung up.
 */
export function resolveFinishedRecipients<T extends ConversationLifecycleRow>(
  members: readonly T[],
): FinishedRecipient<T>[] {
  const recipients: FinishedRecipient<T>[] = [];
  for (const employeeId of participantIds(members)) {
    const call = accessibleConnection(members, employeeId);
    if (call) recipients.push({ employeeId, call });
  }
  return recipients;
}

function employeeOwnsConnection(row: CallLifecycleEmployees, employeeId: string): boolean {
  return PARTICIPANT_FIELDS.some((field) => row[field] === employeeId);
}

function participantIds(members: readonly ConversationLifecycleRow[]): string[] {
  const ids = new Set<string>();
  for (const member of members) {
    for (const field of PARTICIPANT_FIELDS) {
      const id = member[field];
      if (typeof id === 'string' && id.length > 0) ids.add(id);
    }
  }
  return [...ids].sort();
}
