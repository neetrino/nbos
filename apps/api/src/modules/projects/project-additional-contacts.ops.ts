import type { PrismaClient } from '@nbos/database';
import { syncEntityAdditionalContacts } from '../crm/shared/sync-entity-additional-contacts.ops';

/** Replaces project additional contacts; excludes main contact and unknown ids. */
export async function syncProjectAdditionalContacts(
  prisma: InstanceType<typeof PrismaClient>,
  projectId: string,
  contactIds: string[],
  primaryContactId: string | null,
): Promise<void> {
  return syncEntityAdditionalContacts(prisma, 'project', projectId, contactIds, primaryContactId);
}
