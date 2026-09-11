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
 * HTTP Core GET/persist read policy. Socket subscribe must use this, including Task access.
 * `NOT_FOUND` covers missing rows and ACL denials so callers do not leak existence.
 */
export async function resolveCoreConversationRead(
  prisma: PrismaLike,
  employeeId: string,
  conversationId: string,
): Promise<CoreConversationReadResolution> {
  const loaded = await loadMessengerCoreAccessFacts(prisma, employeeId, conversationId);
  if (!loaded.access || loaded.access.viewScope === 'NONE') {
    return { status: 'NO_VIEW' };
  }
  if (!loaded.facts) return { status: 'NOT_FOUND' };
  const decision = evaluateMessengerCoreAccess(loaded.facts);
  if (!decision.canRead) return { status: 'NOT_FOUND' };
  if (loaded.facts.conversationType !== 'TASK') {
    return { status: 'OK', access: loaded.access, facts: loaded.facts, decision };
  }
  return authorizeTaskConversationRead(
    prisma,
    conversationId,
    loaded.access,
    loaded.facts,
    decision,
  );
}

async function authorizeTaskConversationRead(
  prisma: PrismaLike,
  conversationId: string,
  access: MessengerLegacyAccessContext,
  facts: MessengerCoreAccessFacts,
  decision: MessengerCoreAccessDecision,
): Promise<CoreConversationReadResolution> {
  try {
    await requireTaskConversationAccess(prisma, conversationId, {
      employeeId: access.employeeId,
      departmentIds: access.departmentIds,
      viewScope: access.tasksViewScope,
    });
  } catch (error) {
    if (error instanceof NotFoundException) return { status: 'NOT_FOUND' };
    throw error;
  }
  return { status: 'OK', access, facts, decision };
}

export async function employeeMayUseCoreConversation(
  prisma: PrismaLike,
  employeeId: string,
  conversationId: string,
): Promise<boolean> {
  const resolved = await resolveCoreConversationRead(prisma, employeeId, conversationId);
  return resolved.status === 'OK';
}
