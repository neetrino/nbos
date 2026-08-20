import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { PrismaClient, TransactionClient } from '@nbos/database';
import { syncEntityContactLinks } from '../../crm/shared/sync-entity-contact-links.ops';

type Db = InstanceType<typeof PrismaClient> | TransactionClient;

/**
 * Ensures Contact is on the Project (primary if empty, else additional).
 * Canon: Contact ↔ Product — cascade up only.
 */
export async function ensureContactOnProject(
  db: Db,
  projectId: string,
  contactId: string,
): Promise<'primary' | 'additional' | 'already'> {
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { id: true, contactId: true, trashedAt: true },
  });
  if (!project || project.trashedAt) {
    throw new NotFoundException(`Project ${projectId} not found`);
  }
  if (project.contactId === contactId) return 'already';
  if (!project.contactId) {
    await db.project.update({ where: { id: projectId }, data: { contactId } });
    return 'primary';
  }
  await db.projectAdditionalContact.createMany({
    data: [{ projectId, contactId }],
    skipDuplicates: true,
  });
  return 'additional';
}

/** Place Contact on Product; cascade up to Project. */
export async function addContactToProduct(
  db: Db,
  productId: string,
  contactId: string,
): Promise<{ role: 'primary' | 'additional' | 'already'; projectId: string }> {
  const product = await db.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      contactId: true,
      projectId: true,
      project: { select: { trashedAt: true } },
    },
  });
  if (!product || product.project.trashedAt) {
    throw new NotFoundException(`Product ${productId} not found`);
  }
  await ensureContactOnProject(db, product.projectId, contactId);
  if (product.contactId === contactId) {
    return { role: 'already', projectId: product.projectId };
  }
  if (!product.contactId) {
    await db.product.update({ where: { id: productId }, data: { contactId } });
    return { role: 'primary', projectId: product.projectId };
  }
  await db.productAdditionalContact.createMany({
    data: [{ productId, contactId }],
    skipDuplicates: true,
  });
  return { role: 'additional', projectId: product.projectId };
}

/** Sync product contactIds[] then cascade each linked contact up to Project. */
export async function syncProductContactLinks(
  prisma: InstanceType<typeof PrismaClient>,
  productId: string,
  contactIds: string[],
): Promise<{ primaryContactId: string }> {
  if (contactIds.length === 0) {
    throw new BadRequestException('Product requires at least one contact.');
  }
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, projectId: true },
  });
  if (!product) throw new NotFoundException(`Product ${productId} not found`);

  const { primaryContactId } = await syncEntityContactLinks(
    prisma,
    'product',
    productId,
    contactIds,
  );
  if (!primaryContactId) {
    throw new BadRequestException('Product requires a primary contact.');
  }
  for (const contactId of contactIds) {
    await ensureContactOnProject(prisma, product.projectId, contactId);
  }
  return { primaryContactId };
}

/**
 * When contacts are removed from a Project, strip them from all Products in that Project.
 */
export async function clearProductMembershipsForRemovedProjectContacts(
  db: Db,
  projectId: string,
  remainingContactIds: Set<string>,
): Promise<void> {
  const products = await db.product.findMany({
    where: { projectId },
    select: {
      id: true,
      contactId: true,
      additionalContacts: { select: { contactId: true } },
    },
  });
  for (const product of products) {
    const nextAdditional = product.additionalContacts
      .map((row) => row.contactId)
      .filter((id) => remainingContactIds.has(id) && id !== product.contactId);
    await db.productAdditionalContact.deleteMany({ where: { productId: product.id } });
    if (nextAdditional.length > 0) {
      await db.productAdditionalContact.createMany({
        data: nextAdditional.map((contactId) => ({ productId: product.id, contactId })),
        skipDuplicates: true,
      });
    }
    if (!remainingContactIds.has(product.contactId)) {
      const fallback = [...remainingContactIds][0];
      if (!fallback) {
        throw new BadRequestException(
          'Cannot remove the last project contact while products still need a primary contact.',
        );
      }
      await db.product.update({
        where: { id: product.id },
        data: { contactId: fallback },
      });
      await db.productAdditionalContact.deleteMany({
        where: { productId: product.id, contactId: fallback },
      });
    }
  }
}

export async function resolveProjectContactIdForNewProduct(
  db: Db,
  projectId: string,
): Promise<string> {
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { contactId: true, trashedAt: true },
  });
  if (!project || project.trashedAt) {
    throw new NotFoundException(`Project ${projectId} not found`);
  }
  return project.contactId;
}
