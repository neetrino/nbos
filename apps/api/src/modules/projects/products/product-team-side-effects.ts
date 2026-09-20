import { Logger } from '@nestjs/common';
import { PrismaClient, type ProductStatusEnum } from '@nbos/database';
import type { ProductTeamSyncService } from '../../platform-access/product-team-sync.service';
import type { ProductWhatsAppGroupService } from '../../integrations/whatsapp-gateway/product-whatsapp-group.service';
import { syncProductContactLinks } from './product-contacts.ops';
import type { UpdateProductDto } from './product-write-data';

type ProductSlotSyncRow = {
  id: string;
  projectId: string;
  pmId: string | null;
  developerId: string | null;
  frontendDeveloperId: string | null;
  designerId: string | null;
  technicalSpecialistId: string | null;
  sellerId?: string | null;
  qaLeadId: string | null;
};

export async function syncProductContactsIfPatched(
  prisma: InstanceType<typeof PrismaClient>,
  productId: string,
  contactIds: string[] | undefined,
): Promise<string | undefined> {
  if (contactIds === undefined) return undefined;
  const synced = await syncProductContactLinks(prisma, productId, contactIds);
  return synced.primaryContactId;
}

export async function enqueueTechnicalSpecialistIfSlotChanged(
  productWhatsApp: ProductWhatsAppGroupService,
  logger: Logger,
  previous: { technicalSpecialistId?: string | null },
  product: { id: string; status?: string },
  data: UpdateProductDto,
): Promise<void> {
  if (data.technicalSpecialistId === undefined) return;
  if (data.technicalSpecialistId === previous.technicalSpecialistId) return;
  if (product.status !== 'DEVELOPMENT' || !data.technicalSpecialistId) return;
  await enqueueTechnicalSpecialist(productWhatsApp, logger, product.id);
}

export async function syncProductTeamAccess(
  prisma: InstanceType<typeof PrismaClient>,
  productTeamSync: ProductTeamSyncService,
  product: ProductSlotSyncRow,
): Promise<void> {
  await productTeamSync.syncProductSlots({
    productId: product.id,
    projectId: product.projectId,
    row: {
      pmId: product.pmId,
      developerId: product.developerId,
      frontendDeveloperId: product.frontendDeveloperId,
      designerId: product.designerId,
      technicalSpecialistId: product.technicalSpecialistId,
      qaLeadId: product.qaLeadId,
    },
  });
  const sellerId = await loadLinkedProductSellerId(prisma, product.id);
  await productTeamSync.syncProductSeller({
    projectId: product.projectId,
    sellerId,
  });
}

export async function maybeEnqueueTechnicalSpecialist(
  productWhatsApp: ProductWhatsAppGroupService,
  logger: Logger,
  product: { id: string; technicalSpecialistId?: string | null; status?: string },
  targetStatus: ProductStatusEnum,
  actorId?: string,
): Promise<void> {
  if (targetStatus !== 'DEVELOPMENT') return;
  await enqueueTechnicalSpecialist(productWhatsApp, logger, product.id, actorId);
}

export async function enqueueTechnicalSpecialist(
  productWhatsApp: ProductWhatsAppGroupService,
  logger: Logger,
  productId: string,
  actorId?: string,
): Promise<void> {
  try {
    await productWhatsApp.ensureTechnicalSpecialist(productId, actorId);
  } catch (error) {
    logger.warn(
      `WhatsApp ensureTechnicalSpecialist failed for ${productId}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

export async function loadLinkedProductSellerId(
  prisma: InstanceType<typeof PrismaClient>,
  productId: string,
): Promise<string | null> {
  const order = await prisma.order.findFirst({
    where: { productId },
    select: { deal: { select: { sellerId: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return order?.deal?.sellerId ?? null;
}
