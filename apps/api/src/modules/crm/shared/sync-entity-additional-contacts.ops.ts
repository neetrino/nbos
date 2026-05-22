import { BadRequestException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';

export type AdditionalContactEntityKind = 'deal' | 'lead' | 'project';

/** Replaces additional contact links; excludes primary contact id and unknown contacts. */
export async function syncEntityAdditionalContacts(
  prisma: InstanceType<typeof PrismaClient>,
  kind: AdditionalContactEntityKind,
  entityId: string,
  contactIds: string[],
  primaryContactId: string | null,
): Promise<void> {
  const uniqueIds = [...new Set(contactIds.filter(Boolean))].filter(
    (id) => id !== primaryContactId,
  );

  if (uniqueIds.length > 0) {
    const found = await prisma.contact.count({
      where: { id: { in: uniqueIds } },
    });
    if (found !== uniqueIds.length) {
      throw new BadRequestException('One or more additional contacts were not found.');
    }
  }

  if (kind === 'deal') {
    await prisma.dealAdditionalContact.deleteMany({ where: { dealId: entityId } });
    if (uniqueIds.length === 0) return;
    await prisma.dealAdditionalContact.createMany({
      data: uniqueIds.map((contactId) => ({ dealId: entityId, contactId })),
      skipDuplicates: true,
    });
    return;
  }

  if (kind === 'lead') {
    await prisma.leadAdditionalContact.deleteMany({ where: { leadId: entityId } });
    if (uniqueIds.length === 0) return;
    await prisma.leadAdditionalContact.createMany({
      data: uniqueIds.map((contactId) => ({ leadId: entityId, contactId })),
      skipDuplicates: true,
    });
    return;
  }

  await prisma.projectAdditionalContact.deleteMany({ where: { projectId: entityId } });
  if (uniqueIds.length === 0) return;
  await prisma.projectAdditionalContact.createMany({
    data: uniqueIds.map((contactId) => ({ projectId: entityId, contactId })),
    skipDuplicates: true,
  });
}
