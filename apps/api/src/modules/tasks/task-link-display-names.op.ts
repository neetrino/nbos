import { PrismaClient } from '@nbos/database';

type TaskLinkRow = { entityType: string; entityId: string };

type TypedIdSets = {
  projectIds: Set<string>;
  productIds: Set<string>;
  extensionIds: Set<string>;
  orderIds: Set<string>;
  dealIds: Set<string>;
  leadIds: Set<string>;
};

export function resolveNamedCodeLabel(row: { name?: string | null; code: string }): string {
  return row.name?.trim() || row.code;
}

function emptyTypedIdSets(): TypedIdSets {
  return {
    projectIds: new Set<string>(),
    productIds: new Set<string>(),
    extensionIds: new Set<string>(),
    orderIds: new Set<string>(),
    dealIds: new Set<string>(),
    leadIds: new Set<string>(),
  };
}

function addTypedId(sets: TypedIdSets, link: TaskLinkRow): void {
  switch (link.entityType) {
    case 'PROJECT':
      sets.projectIds.add(link.entityId);
      return;
    case 'PRODUCT':
      sets.productIds.add(link.entityId);
      return;
    case 'EXTENSION':
      sets.extensionIds.add(link.entityId);
      return;
    case 'ORDER':
      sets.orderIds.add(link.entityId);
      return;
    case 'DEAL':
      sets.dealIds.add(link.entityId);
      return;
    case 'LEAD':
      sets.leadIds.add(link.entityId);
      return;
    default:
      return;
  }
}

function collectTypedIds(links: TaskLinkRow[]): TypedIdSets {
  const sets = emptyTypedIdSets();
  for (const link of links) addTypedId(sets, link);
  return sets;
}

function mergeTypedIdSets(into: TypedIdSets, from: TypedIdSets): void {
  from.projectIds.forEach((id) => into.projectIds.add(id));
  from.productIds.forEach((id) => into.productIds.add(id));
  from.extensionIds.forEach((id) => into.extensionIds.add(id));
  from.orderIds.forEach((id) => into.orderIds.add(id));
  from.dealIds.forEach((id) => into.dealIds.add(id));
  from.leadIds.forEach((id) => into.leadIds.add(id));
}

async function loadLinkEntities(prisma: InstanceType<typeof PrismaClient>, sets: TypedIdSets) {
  const { projectIds, productIds, extensionIds, orderIds, dealIds, leadIds } = sets;
  const [projects, products, extensions, orders, deals, leads] = await Promise.all([
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
    leadIds.size > 0
      ? prisma.lead.findMany({
          where: { id: { in: [...leadIds] } },
          select: { id: true, code: true, name: true },
        })
      : [],
  ]);
  return { projects, products, extensions, orders, deals, leads };
}

async function loadLabelMaps(prisma: InstanceType<typeof PrismaClient>, sets: TypedIdSets) {
  const rows = await loadLinkEntities(prisma, sets);
  return {
    PROJECT: new Map(rows.projects.map((p) => [p.id, p.name] as const)),
    PRODUCT: new Map(rows.products.map((p) => [p.id, p.name] as const)),
    EXTENSION: new Map(rows.extensions.map((e) => [e.id, e.name] as const)),
    ORDER: new Map(rows.orders.map((o) => [o.id, o.code] as const)),
    DEAL: new Map(rows.deals.map((d) => [d.id, resolveNamedCodeLabel(d)] as const)),
    LEAD: new Map(rows.leads.map((lead) => [lead.id, resolveNamedCodeLabel(lead)] as const)),
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
  const merged = emptyTypedIdSets();
  for (const task of tasks) mergeTypedIdSets(merged, collectTypedIds(task.links ?? []));
  const maps = await loadLabelMaps(prisma, merged);
  for (const task of tasks) {
    const links = task.links ?? [];
    for (const link of links) {
      Object.assign(link, { entityLabel: labelForLink(link, maps) });
    }
  }
}
