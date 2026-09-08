import type { Prisma } from '@nbos/database';
import { isTrashScope, type EntityLifecycleScope } from '@nbos/shared';
import {
  mergeProfileAListScope,
  parseLifecycleScopeFromQuery,
} from '../../common/lifecycle/entity-lifecycle-scope';

export const PROJECT_HUB_VIEWS = ['incoming', 'active', 'closed'] as const;
export type ProjectHubView = (typeof PROJECT_HUB_VIEWS)[number];

const TERMINAL_LEGACY_STATUSES = ['DONE', 'LOST'] as const;
const LIVE_MAINTENANCE_TYPES = ['MAINTENANCE_ONLY', 'DEV_AND_MAINTENANCE'] as const;
const LIVE_MAINTENANCE_STATUSES = ['PENDING', 'ACTIVE'] as const;

export interface ProjectListQueryParams {
  page?: number;
  pageSize?: number;
  scope?: string;
  hubView?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function parseProjectHubView(value?: string): ProjectHubView | undefined {
  if (value === 'incoming' || value === 'active' || value === 'closed') return value;
  return undefined;
}

export function resolveProjectListScope(params: ProjectListQueryParams): EntityLifecycleScope {
  return parseLifecycleScopeFromQuery(params.scope);
}

export function buildProjectListWhere(params: ProjectListQueryParams): Prisma.ProjectWhereInput {
  const scope = resolveProjectListScope(params);
  const where: Prisma.ProjectWhereInput = mergeProfileAListScope({}, scope);
  const hubView = isTrashScope(scope) ? undefined : parseProjectHubView(params.hubView);
  applyProjectHubListFilters(where, hubView, buildProjectSearchOr(params.search));
  return where;
}

export function buildProjectHubViewWhere(view: ProjectHubView): Prisma.ProjectWhereInput {
  if (view === 'incoming') return incomingProjectWhere();
  if (view === 'active') return activeProjectWhere();
  return closedProjectWhere();
}

function applyProjectHubListFilters(
  where: Prisma.ProjectWhereInput,
  hubView: ProjectHubView | undefined,
  searchOr: Prisma.ProjectWhereInput[] | undefined,
): void {
  const hubWhere = hubView ? buildProjectHubViewWhere(hubView) : undefined;
  if (hubWhere && searchOr) {
    where.AND = [hubWhere, { OR: searchOr }];
    return;
  }
  if (hubWhere) Object.assign(where, hubWhere);
  if (searchOr) where.OR = searchOr;
}

function buildProjectSearchOr(search?: string): Prisma.ProjectWhereInput[] | undefined {
  const q = search?.trim();
  if (!q) return undefined;
  return [
    { name: { contains: q, mode: 'insensitive' } },
    { code: { contains: q, mode: 'insensitive' } },
    { company: { name: { contains: q, mode: 'insensitive' } } },
    { contact: { firstName: { contains: q, mode: 'insensitive' } } },
    { contact: { lastName: { contains: q, mode: 'insensitive' } } },
  ];
}

function openDeliveryWhere() {
  return {
    deliveryResolution: null,
    status: { notIn: [...TERMINAL_LEGACY_STATUSES] },
  };
}

function liveMaintenanceWhere() {
  return {
    type: { in: [...LIVE_MAINTENANCE_TYPES] },
    status: { in: [...LIVE_MAINTENANCE_STATUSES] },
  };
}

function incomingProjectWhere(): Prisma.ProjectWhereInput {
  return { products: { none: {} }, extensions: { none: {} } };
}

function activeProjectWhere(): Prisma.ProjectWhereInput {
  const open = openDeliveryWhere();
  return {
    OR: [
      { products: { some: open } },
      { extensions: { some: open } },
      { subscriptions: { some: liveMaintenanceWhere() } },
    ],
  };
}

function closedProjectWhere(): Prisma.ProjectWhereInput {
  const open = openDeliveryWhere();
  return {
    AND: [
      { OR: [{ products: { some: {} } }, { extensions: { some: {} } }] },
      { products: { none: open } },
      { extensions: { none: open } },
      { subscriptions: { none: liveMaintenanceWhere() } },
    ],
  };
}
