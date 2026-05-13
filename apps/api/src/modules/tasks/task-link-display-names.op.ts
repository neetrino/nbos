import { PrismaClient } from '@nbos/database';

type TaskLinkRow = { entityType: string; entityId: string };

function collectTypedIds(links: TaskLinkRow[]) {
  const projectIds = new Set<string>();
  const productIds = new Set<string>();
  const extensionIds = new Set<string>();
  const orderIds = new Set<string>();
  const dealIds = new Set<string>();
  for (const link of links) {
    switch (link.entityType) {
      case 'PROJECT':
        projectIds.add(link.entityId);
        break;
      case 'PRODUCT':
        productIds.add(link.entityId);
        break;
      case 'EXTENSION':
        extensionIds.add(link.entityId);
        break;
      case 'ORDER':
        orderIds.add(link.entityId);
        break;
      case 'DEAL':
        dealIds.add(link.entityId);
        break;
      default:
        break;
    }
  }
  return { projectIds, productIds, extensionIds, orderIds, dealIds };
}

async function loadLabelMaps(
  prisma: InstanceType<typeof PrismaClient>,
  sets: ReturnType<typeof collectTypedIds>,
) {
  const { projectIds, productIds, extensionIds, orderIds, dealIds } = sets;
  const [projects, products, extensions, orders, deals] = await Promise.all([
    projectIds.size > 0
      ? prisma.project.findMany({
          where: { id: { in: [...projectIds] } },
          select: { id: true, name: true },
        })
      : [],
    productIds.size > 0
      ? prisma.product.findMany({
          where: { id: { in: [...productIds] } },
          select: { id: true, name: true },
        })
      : [],
    extensionIds.size > 0
      ? prisma.extension.findMany({
          where: { id: { in: [...extensionIds] } },
          select: { id: true, name: true },
        })
      : [],
    orderIds.size > 0
      ? prisma.order.findMany({
          where: { id: { in: [...orderIds] } },
          select: { id: true, code: true },
        })
      : [],
    dealIds.size > 0
      ? prisma.deal.findMany({
          where: { id: { in: [...dealIds] } },
          select: { id: true, code: true, name: true },
        })
      : [],
  ]);
  return {
    PROJECT: new Map(projects.map((p) => [p.id, p.name] as const)),
    PRODUCT: new Map(products.map((p) => [p.id, p.name] as const)),
    EXTENSION: new Map(extensions.map((e) => [e.id, e.name] as const)),
    ORDER: new Map(orders.map((o) => [o.id, o.code] as const)),
    DEAL: new Map(deals.map((d) => [d.id, (d.name?.trim() ? d.name : d.code) ?? d.code] as const)),
  };
}

function labelForLink(
  link: TaskLinkRow,
  maps: Awaited<ReturnType<typeof loadLabelMaps>>,
): string | null {
  const map = maps[link.entityType as keyof typeof maps];
  if (!map) return null;
  return map.get(link.entityId) ?? null;
}

/**
 * Adds `entityLabel` to each task link for API responses (project/product names, etc.).
 */
export async function attachTaskLinkDisplayNames(
  prisma: InstanceType<typeof PrismaClient>,
  tasks: Array<{ links?: TaskLinkRow[] | null }>,
): Promise<void> {
  if (tasks.length === 0) return;
  const merged = {
    projectIds: new Set<string>(),
    productIds: new Set<string>(),
    extensionIds: new Set<string>(),
    orderIds: new Set<string>(),
    dealIds: new Set<string>(),
  };
  for (const task of tasks) {
    const s = collectTypedIds(task.links ?? []);
    s.projectIds.forEach((id) => merged.projectIds.add(id));
    s.productIds.forEach((id) => merged.productIds.add(id));
    s.extensionIds.forEach((id) => merged.extensionIds.add(id));
    s.orderIds.forEach((id) => merged.orderIds.add(id));
    s.dealIds.forEach((id) => merged.dealIds.add(id));
  }
  const maps = await loadLabelMaps(prisma, merged);
  for (const task of tasks) {
    const links = task.links ?? [];
    for (const link of links) {
      Object.assign(link, { entityLabel: labelForLink(link, maps) });
    }
  }
}
