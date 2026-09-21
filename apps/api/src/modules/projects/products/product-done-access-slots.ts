import type { PrismaClient } from '@nbos/database';
import {
  getMissingRequiredAccessSlotsForDone,
  isDomainConnectionSatisfied,
  type DomainConnectionMode,
  type DomainHeaderStatusInput,
} from '@nbos/shared';
import { CLIENT_SERVICE_TASK_ENTITY_TYPE } from '../../client-services/client-service-flow-helpers';
import { DOMAIN_PREP_MARKERS } from '../../client-services/domain-purchase/domain-operation-tasks';

export async function loadMissingRequiredAccessSlotKeys(
  prisma: InstanceType<typeof PrismaClient>,
  product: {
    id: string;
    productCategory: string;
    productType: string;
    productPlatform?: string | null;
  },
): Promise<string[]> {
  const bindings = await prisma.productAccessSlotBinding.findMany({
    where: { productId: product.id },
    select: { slotKey: true },
  });
  const missing = getMissingRequiredAccessSlotsForDone({
    productCategory: product.productCategory,
    productType: product.productType,
    productPlatform: product.productPlatform,
    boundSlotKeys: [...new Set(bindings.map((row) => row.slotKey))],
  });
  if (!missing.includes('DOMAIN')) return missing;
  if (await productHasSatisfiedDomainConnection(prisma, product.id)) {
    return missing.filter((key) => key !== 'DOMAIN');
  }
  return missing;
}

async function productHasSatisfiedDomainConnection(
  prisma: InstanceType<typeof PrismaClient>,
  productId: string,
): Promise<boolean> {
  const rows = await prisma.clientServiceRecord.findMany({
    where: { productId, type: 'DOMAIN', status: { not: 'CANCELLED' } },
    select: {
      id: true,
      name: true,
      status: true,
      connectionMode: true,
      providerAccountId: true,
      registrationConfirmedAt: true,
      connectionVerifiedAt: true,
      dnsInstructions: true,
    },
  });
  if (rows.length === 0) return false;
  const dnsDoneIds = await loadCompletedDnsPrepServiceIds(
    prisma,
    rows.filter((row) => row.connectionMode === 'CLIENT_DNS').map((row) => row.id),
  );
  return rows.every((row) => {
    if (!row.connectionMode) return false;
    const input: DomainHeaderStatusInput = {
      domainName: row.name,
      connectionMode: row.connectionMode as DomainConnectionMode,
      status: row.status,
      hasOpenInvoice: false,
      hasCredential: Boolean(row.providerAccountId),
      registrationConfirmed: Boolean(row.registrationConfirmedAt),
      connectionVerified: Boolean(row.connectionVerifiedAt),
      hasDnsInstructions: Boolean(row.dnsInstructions?.trim()),
      dnsPrepTaskDone: dnsDoneIds.has(row.id),
    };
    return isDomainConnectionSatisfied(input);
  });
}

async function loadCompletedDnsPrepServiceIds(
  prisma: InstanceType<typeof PrismaClient>,
  serviceIds: readonly string[],
): Promise<Set<string>> {
  if (serviceIds.length === 0) return new Set();
  const tasks = await prisma.task.findMany({
    where: {
      status: 'COMPLETED',
      description: { contains: DOMAIN_PREP_MARKERS.CLIENT_DNS },
      links: {
        some: {
          entityType: CLIENT_SERVICE_TASK_ENTITY_TYPE,
          entityId: { in: [...serviceIds] },
        },
      },
    },
    select: {
      links: {
        where: {
          entityType: CLIENT_SERVICE_TASK_ENTITY_TYPE,
          entityId: { in: [...serviceIds] },
        },
        select: { entityId: true },
      },
    },
  });
  return new Set(tasks.flatMap((task) => task.links.map((link) => link.entityId)));
}
