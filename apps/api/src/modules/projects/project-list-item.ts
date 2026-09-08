import {
  classifyProjectHubStatus,
  liveMaintenanceWhere,
  openDeliveryWhere,
} from './project-hub-status';

export const PROJECT_LIST_INCLUDE = {
  company: { select: { id: true, name: true } },
  contact: { select: { id: true, firstName: true, lastName: true } },
  _count: { select: { orders: true, products: true, extensions: true } },
  products: { where: openDeliveryWhere(), select: { id: true }, take: 1 },
  extensions: { where: openDeliveryWhere(), select: { id: true }, take: 1 },
  subscriptions: { where: liveMaintenanceWhere(), select: { id: true }, take: 1 },
} as const;

type ProjectListRow = {
  trashedAt: Date | null;
  _count: { orders: number; products: number; extensions: number };
  products: Array<{ id: string }>;
  extensions: Array<{ id: string }>;
  subscriptions: Array<{ id: string }>;
};

export function toProjectListItem<T extends ProjectListRow>(row: T) {
  const { products, extensions, subscriptions, ...project } = row;
  return {
    ...project,
    hubView: classifyProjectHubStatus({
      trashedAt: project.trashedAt,
      productCount: project._count.products,
      extensionCount: project._count.extensions,
      hasOpenDelivery: products.length > 0 || extensions.length > 0,
      hasLiveMaintenance: subscriptions.length > 0,
    }),
  };
}
