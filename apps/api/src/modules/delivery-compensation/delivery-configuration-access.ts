import { NotFoundException } from '@nestjs/common';
import type { Prisma, PrismaClient } from '@nbos/database';
import { DELIVERY_CONFIGURATION_PERMISSION_MODULE } from '@nbos/shared';
import { permissionDepartmentIds } from '../../common/authorization/permission-department-scope';
import type { CurrentUserPayload } from '../../common/decorators';
import { buildProductParticipationWhere } from '../platform-access/platform-team-graph.where';

type Db = Pick<
  InstanceType<typeof PrismaClient>,
  'product' | 'extension' | 'deliveryConfiguration' | 'employeeDepartment'
>;

export type ConfigurationAction = 'VIEW' | 'EDIT';

/** Caller identity plus the RBAC scope of the permission the route matched. */
export interface DeliveryConfigurationAccess {
  employeeId: string;
  departmentIds: string[];
  scope: string;
}

const SCOPE_ALL = 'ALL';
const SCOPE_DEPARTMENT = 'DEPARTMENT';

/**
 * Canon §16: an actor "manages their configuration within the bounds of their access to the
 * Product". `DELIVERY_CONFIGURATION` says whether somebody may configure deliveries at all; this
 * says which cards. Without it any holder of the permission reaches every configuration by id.
 */
export function configurationAccessFromUser(
  user: CurrentUserPayload,
  action: ConfigurationAction,
): DeliveryConfigurationAccess {
  const permissionKey = `${DELIVERY_CONFIGURATION_PERMISSION_MODULE}_${action}`;
  return {
    employeeId: user.id,
    departmentIds: permissionDepartmentIds(user, permissionKey),
    scope: user.permissions[permissionKey] ?? '',
  };
}

/** A delivery a card belongs to reaches its team through the product, on both entity kinds. */
export function buildExtensionParticipationWhere(
  scopedEmployeeIds: string[],
): Prisma.ExtensionWhereInput {
  return {
    OR: [
      { assignedTo: { in: scopedEmployeeIds } },
      { product: buildProductParticipationWhere(scopedEmployeeIds) },
    ],
  };
}

export async function assertProductConfigurable(
  db: Db,
  productId: string,
  access: DeliveryConfigurationAccess,
): Promise<void> {
  if (bypassesRowFilter(access)) return;
  const scopedIds = await loadScopedEmployeeIds(db, access);
  const row = await db.product.findFirst({
    where: { AND: [{ id: productId }, buildProductParticipationWhere(scopedIds)] },
    select: { id: true },
  });
  if (!row) {
    throw new NotFoundException(`Product ${productId} not found`);
  }
}

export async function assertExtensionConfigurable(
  db: Db,
  extensionId: string,
  access: DeliveryConfigurationAccess,
): Promise<void> {
  if (bypassesRowFilter(access)) return;
  const scopedIds = await loadScopedEmployeeIds(db, access);
  const row = await db.extension.findFirst({
    where: { AND: [{ id: extensionId }, buildExtensionParticipationWhere(scopedIds)] },
    select: { id: true },
  });
  if (!row) {
    throw new NotFoundException(`Extension ${extensionId} not found`);
  }
}

/**
 * Reached from a configuration id, which is how every money command arrives. A configuration hangs
 * off exactly one product or one extension, so one query covers both kinds.
 */
export async function assertConfigurationAccessible(
  db: Db,
  configurationId: string,
  access: DeliveryConfigurationAccess,
): Promise<void> {
  if (bypassesRowFilter(access)) return;
  const scopedIds = await loadScopedEmployeeIds(db, access);
  const row = await db.deliveryConfiguration.findFirst({
    where: {
      id: configurationId,
      OR: [
        { product: buildProductParticipationWhere(scopedIds) },
        { extension: buildExtensionParticipationWhere(scopedIds) },
      ],
    },
    select: { id: true },
  });
  if (!row) {
    throw new NotFoundException(`Delivery configuration ${configurationId} not found`);
  }
}

/** `ALL` is company-wide by definition, so it skips the row filter as it does in every module. */
function bypassesRowFilter(access: DeliveryConfigurationAccess): boolean {
  return access.scope.trim().toUpperCase() === SCOPE_ALL;
}

async function loadScopedEmployeeIds(
  db: Db,
  access: DeliveryConfigurationAccess,
): Promise<string[]> {
  const ids = new Set<string>([access.employeeId]);
  if (access.scope.trim().toUpperCase() !== SCOPE_DEPARTMENT || access.departmentIds.length === 0) {
    return [...ids];
  }
  const rows = await db.employeeDepartment.findMany({
    where: { departmentId: { in: access.departmentIds } },
    select: { employeeId: true },
    distinct: ['employeeId'],
  });
  for (const row of rows) ids.add(row.employeeId);
  return [...ids];
}
