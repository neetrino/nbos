import { PrismaClient } from '@nbos/database';
import { sumConfiguredRoleUnits } from '@nbos/shared';

type SalePriceTargetRow = {
  targetKey: string;
  functionId: string | null;
  tierId: string | null;
  baseProfileVersionId: string | null;
};

type RoleUnitRow = { units: { toString(): string } | null };

/**
 * Published units of each priced item, so the client line amount can be computed without
 * sending units to a caller who may not see cost. Draft vectors do not price a card.
 */
export async function loadUnitsBySaleTarget(
  prisma: InstanceType<typeof PrismaClient>,
  rows: readonly SalePriceTargetRow[],
): Promise<Map<string, string | null>> {
  const functionIds = uniqueIds(rows.map((row) => row.functionId));
  const tierIds = uniqueIds(rows.map((row) => row.tierId));
  const coreIds = uniqueIds(rows.map((row) => row.baseProfileVersionId));
  const [functions, tiers, cores] = await Promise.all([
    loadFunctionUnits(prisma, functionIds),
    loadTierUnits(prisma, tierIds),
    loadCoreUnits(prisma, coreIds),
  ]);
  const units = new Map<string, string | null>();
  for (const row of rows) {
    if (row.functionId) units.set(row.targetKey, functions.get(row.functionId) ?? null);
    if (row.tierId) units.set(row.targetKey, tiers.get(row.tierId) ?? null);
    if (row.baseProfileVersionId) {
      units.set(row.targetKey, cores.get(row.baseProfileVersionId) ?? null);
    }
  }
  return units;
}

function uniqueIds(ids: Array<string | null>): string[] {
  return [...new Set(ids.filter((id): id is string => id !== null))];
}

async function loadFunctionUnits(
  prisma: InstanceType<typeof PrismaClient>,
  functionIds: string[],
): Promise<Map<string, string | null>> {
  if (functionIds.length === 0) return new Map();
  const versions = await prisma.deliveryFunctionPriceVersion.findMany({
    where: { functionId: { in: functionIds }, tierId: null },
    select: {
      functionId: true,
      version: true,
      status: true,
      roleUnits: { select: { units: true } },
    },
  });
  return pickNewestUnits(versions, (row) => row.functionId);
}

async function loadTierUnits(
  prisma: InstanceType<typeof PrismaClient>,
  tierIds: string[],
): Promise<Map<string, string | null>> {
  if (tierIds.length === 0) return new Map();
  const versions = await prisma.deliveryFunctionPriceVersion.findMany({
    where: { tierId: { in: tierIds } },
    select: { tierId: true, version: true, status: true, roleUnits: { select: { units: true } } },
  });
  return pickNewestUnits(
    versions.filter((row): row is typeof row & { tierId: string } => row.tierId !== null),
    (row) => row.tierId,
  );
}

async function loadCoreUnits(
  prisma: InstanceType<typeof PrismaClient>,
  coreIds: string[],
): Promise<Map<string, string | null>> {
  if (coreIds.length === 0) return new Map();
  const versions = await prisma.deliveryBaseProfileVersion.findMany({
    where: { id: { in: coreIds }, status: 'PUBLISHED' },
    select: { id: true, roleUnits: { select: { units: true } } },
  });
  return new Map(versions.map((row) => [row.id, unitsFromRoles(row.roleUnits)]));
}

function pickNewestUnits<T extends { version: number; status: string; roleUnits: RoleUnitRow[] }>(
  rows: readonly T[],
  keyOf: (row: T) => string,
): Map<string, string | null> {
  const grouped = new Map<string, T[]>();
  for (const row of rows) {
    const key = keyOf(row);
    const list = grouped.get(key);
    if (list) list.push(row);
    else grouped.set(key, [row]);
  }
  const result = new Map<string, string | null>();
  for (const [key, versions] of grouped) {
    const chosen = newest(versions.filter((row) => row.status === 'PUBLISHED'));
    result.set(key, chosen ? unitsFromRoles(chosen.roleUnits) : null);
  }
  return result;
}

function newest<T extends { version: number }>(rows: readonly T[]): T | undefined {
  if (rows.length === 0) return undefined;
  return [...rows].sort((left, right) => right.version - left.version)[0];
}

function unitsFromRoles(rows: readonly RoleUnitRow[]): string | null {
  return sumConfiguredRoleUnits(rows.map((row) => ({ units: row.units?.toString() ?? null })));
}
