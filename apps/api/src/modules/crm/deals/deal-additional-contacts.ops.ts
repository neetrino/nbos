import { BadRequestException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';

/** Replaces deal additional contacts; excludes primary contact and unknown ids. */
export async function syncDealAdditionalContacts(
  prisma: InstanceType<typeof PrismaClient>,
  dealId: string,
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

  await prisma.dealAdditionalContact.deleteMany({ where: { dealId } });

  if (uniqueIds.length === 0) return;

  await prisma.dealAdditionalContact.createMany({
    data: uniqueIds.map((contactId) => ({ dealId, contactId })),
    skipDuplicates: true,
  });
}
