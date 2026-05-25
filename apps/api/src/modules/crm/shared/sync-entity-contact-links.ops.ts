import { BadRequestException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';
import { splitEntityContactIds } from '@nbos/shared';

export type EntityContactLinkKind = 'deal' | 'lead' | 'project';

/** Persists full contact list: first id → primary FK, rest → junction table. */
export async function syncEntityContactLinks(
  prisma: InstanceType<typeof PrismaClient>,
  kind: EntityContactLinkKind,
  entityId: string,
  contactIds: string[],
): Promise<{ primaryContactId: string | null }> {
  const { primaryContactId, additionalContactIds } = splitEntityContactIds(contactIds);

  const uniqueAdditional = [...new Set(additionalContactIds.filter(Boolean))];

  if (uniqueAdditional.length > 0) {
    const found = await prisma.contact.count({
      where: { id: { in: uniqueAdditional } },
    });
    if (found !== uniqueAdditional.length) {
      throw new BadRequestException('One or more contacts were not found.');
    }
  }

  if (primaryContactId) {
    const primary = await prisma.contact.count({ where: { id: primaryContactId } });
    if (primary !== 1) {
      throw new BadRequestException('Primary contact was not found.');
    }
  }

  if (kind === 'deal') {
    await prisma.dealAdditionalContact.deleteMany({ where: { dealId: entityId } });
    if (uniqueAdditional.length > 0) {
      await prisma.dealAdditionalContact.createMany({
        data: uniqueAdditional.map((contactId) => ({ dealId: entityId, contactId })),
        skipDuplicates: true,
      });
    }
  } else if (kind === 'lead') {
    await prisma.leadAdditionalContact.deleteMany({ where: { leadId: entityId } });
    if (uniqueAdditional.length > 0) {
      await prisma.leadAdditionalContact.createMany({
        data: uniqueAdditional.map((contactId) => ({ leadId: entityId, contactId })),
        skipDuplicates: true,
      });
    }
  } else {
    await prisma.projectAdditionalContact.deleteMany({ where: { projectId: entityId } });
    if (uniqueAdditional.length > 0) {
      await prisma.projectAdditionalContact.createMany({
        data: uniqueAdditional.map((contactId) => ({ projectId: entityId, contactId })),
        skipDuplicates: true,
      });
    }
  }

  return { primaryContactId };
}
