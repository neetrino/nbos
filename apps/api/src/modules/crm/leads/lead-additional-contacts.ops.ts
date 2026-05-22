import type { PrismaClient } from '@nbos/database';
import { syncEntityAdditionalContacts } from '../shared/sync-entity-additional-contacts.ops';

/** Replaces lead additional contacts; excludes primary contact and unknown ids. */
export async function syncLeadAdditionalContacts(
  prisma: InstanceType<typeof PrismaClient>,
  leadId: string,
  contactIds: string[],
  primaryContactId: string | null,
): Promise<void> {
  return syncEntityAdditionalContacts(prisma, 'lead', leadId, contactIds, primaryContactId);
}
