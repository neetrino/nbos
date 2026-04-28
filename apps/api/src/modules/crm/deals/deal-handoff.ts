import type { PrismaClient } from '@nbos/database';
import type { DealForHandoff, DealHandoffReferences } from './deal.types';

type PrismaInstance = InstanceType<typeof PrismaClient>;

export async function attachDealHandoffReferences<T extends DealForHandoff>(
  prisma: PrismaInstance,
  deal: T,
): Promise<T & { handoff: DealHandoffReferences }> {
  if (!deal.projectId) {
    return { ...deal, handoff: emptyDealHandoff() };
  }

  const [project, maintenanceDeal] = await Promise.all([
    getProjectHandoff(prisma, deal.projectId),
    getMaintenanceDealHandoff(prisma, deal),
  ]);

  return {
    ...deal,
    handoff: {
      project: project ? { id: project.id, code: project.code, name: project.name } : null,
      product: deal.existingProduct ?? project?.products[0] ?? null,
      subscriptions: project?.subscriptions ?? [],
      maintenanceDeal,
    },
  };
}

function getProjectHandoff(prisma: PrismaInstance, projectId: string) {
  return prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      code: true,
      name: true,
      products: {
        select: { id: true, name: true, productType: true, status: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      subscriptions: {
        select: { id: true, code: true, type: true, status: true, amount: true },
        orderBy: { startDate: 'desc' },
      },
    },
  });
}

function getMaintenanceDealHandoff(prisma: PrismaInstance, deal: DealForHandoff) {
  if (deal.type !== 'PRODUCT' || !deal.projectId) {
    return Promise.resolve(null);
  }

  return prisma.deal.findFirst({
    where: { projectId: deal.projectId, type: 'MAINTENANCE' },
    select: {
      id: true,
      code: true,
      name: true,
      status: true,
      amount: true,
      maintenanceStartAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

function emptyDealHandoff(): DealHandoffReferences {
  return {
    project: null,
    product: null,
    subscriptions: [],
    maintenanceDeal: null,
  };
}
