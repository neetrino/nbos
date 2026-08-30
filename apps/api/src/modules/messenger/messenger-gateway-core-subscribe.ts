import type { PrismaClient } from '@nbos/database';
import { evaluateMessengerCoreAccess } from './core/messenger-core-access';
import { loadMessengerCoreAccessFacts } from './core/messenger-core-access-load';

type PrismaLike = InstanceType<typeof PrismaClient>;

export async function employeeMayUseCoreConversation(
  prisma: PrismaLike,
  employeeId: string,
  conversationId: string,
): Promise<boolean> {
  const loaded = await loadMessengerCoreAccessFacts(prisma, employeeId, conversationId);
  if (!loaded.access || loaded.access.viewScope === 'NONE' || !loaded.facts) return false;
  return evaluateMessengerCoreAccess(loaded.facts).canRead;
}

export function extractConversationId(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const raw = (body as { conversationId?: unknown }).conversationId;
  if (typeof raw !== 'string') return null;
  const id = raw.trim();
  return id.length > 0 ? id : null;
}
