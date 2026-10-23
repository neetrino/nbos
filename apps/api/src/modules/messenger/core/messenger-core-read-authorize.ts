import { NotFoundException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';
import type { MessengerLegacyAccessContext } from '../access/messenger-legacy-channel-access.op';
import { evaluateMessengerCoreAccess } from './messenger-core-access';
import { loadMessengerCoreAccessFacts } from './messenger-core-access-load';
import type {
  MessengerCoreAccessDecision,
  MessengerCoreAccessFacts,
} from './messenger-core-access.types';
import { requireTaskConversationAccess } from './messenger-core-task-access.ops';

type PrismaLike = InstanceType<typeof PrismaClient>;

export type CoreConversationReadResolution =
  | { status: 'NO_VIEW' }
  | { status: 'NOT_FOUND' }
  | {
      status: 'OK';
      access: MessengerLegacyAccessContext;
      facts: MessengerCoreAccessFacts;
      decision: MessengerCoreAccessDecision;
    };

/**
 * Posting a message is allowed when Messenger grants write, or when the
 * conversation is a Task the caller may already open. Pin and membership stay on `canWrite`.
 */
export function mayPostInternalMessage(resolved: {
  facts: { conversationType?: MessengerCoreAccessFacts['conversationType'] };
  decision: { canWrite: boolean };
}): boolean {
  return resolved.decision.canWrite || resolved.facts.conversationType === 'TASK';
}

/**
 * HTTP Core GET/persist read policy. Socket subscribe must use this, including Task access.
 * `NOT_FOUND` covers missing rows and ACL denials so callers do not leak existence.
 * A Task the caller can open is readable here even without Messenger membership or edit.
 */
export async function resolveCoreConversationRead(
  prisma: PrismaLike,
  employeeId: string,
  conversationId: string,
): Promise<CoreConversationReadResolution> {
  const loaded = await loadMessengerCoreAccessFacts(prisma, employeeId, conversationId);
  if (!loaded.access) return { status: 'NO_VIEW' };
  if (!loaded.facts) return missingConversationStatus(loaded.access.viewScope);
  if (loaded.facts.conversationType === 'TASK') {
    return authorizeTaskConversationRead(prisma, conversationId, loaded.access, loaded.facts);
  }
  if (loaded.access.viewScope === 'NONE') return { status: 'NO_VIEW' };
  const decision = evaluateMessengerCoreAccess(loaded.facts);
  if (!decision.canRead) return { status: 'NOT_FOUND' };
  return { status: 'OK', access: loaded.access, facts: loaded.facts, decision };
}

function missingConversationStatus(
  viewScope: MessengerLegacyAccessContext['viewScope'],
): CoreConversationReadResolution {
  return viewScope === 'NONE' ? { status: 'NO_VIEW' } : { status: 'NOT_FOUND' };
}

async function authorizeTaskConversationRead(
  prisma: PrismaLike,
  conversationId: string,
  access: MessengerLegacyAccessContext,
  facts: MessengerCoreAccessFacts,
): Promise<CoreConversationReadResolution> {
  try {
    await requireTaskConversationAccess(prisma, conversationId, {
      employeeId: access.employeeId,
      departmentIds: access.departmentIds,
      viewScope: access.tasksViewScope,
    });
  } catch (error) {
    if (error instanceof NotFoundException) return deniedTaskConversation(access.viewScope);
    throw error;
  }
  const decision = evaluateMessengerCoreAccess(facts);
  return {
    status: 'OK',
    access,
    facts,
    decision: { ...decision, canRead: true },
  };
}

/** Hide Task conversation ids from callers who have no Messenger view at all. */
function deniedTaskConversation(
  viewScope: MessengerLegacyAccessContext['viewScope'],
): CoreConversationReadResolution {
  return viewScope === 'NONE' ? { status: 'NO_VIEW' } : { status: 'NOT_FOUND' };
}

export async function employeeMayUseCoreConversation(
  prisma: PrismaLike,
  employeeId: string,
  conversationId: string,
): Promise<boolean> {
  const resolved = await resolveCoreConversationRead(prisma, employeeId, conversationId);
  return resolved.status === 'OK';
}
