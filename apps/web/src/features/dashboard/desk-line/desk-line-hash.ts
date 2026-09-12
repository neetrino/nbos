import { DESK_LINE_CATALOG_VERSION } from './desk-line.constants';

const FNV_OFFSET = 2166136261;
const FNV_PRIME = 16777619;

export function unsignedHash(seed: string): number {
  let hash = FNV_OFFSET;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, FNV_PRIME);
  }
  return hash >>> 0;
}

export function positiveModulo(value: number, modulo: number): number {
  if (modulo <= 0) return 0;
  return ((value % modulo) + modulo) % modulo;
}

export function catalogSeed(employeeId: string, ...parts: readonly string[]): string {
  return [DESK_LINE_CATALOG_VERSION, employeeId, ...parts].join('|');
}

export function compareByPersonalOrder(
  employeeId: string,
  poolId: string,
  leftId: string,
  rightId: string,
): number {
  const left = unsignedHash(catalogSeed(employeeId, poolId, leftId));
  const right = unsignedHash(catalogSeed(employeeId, poolId, rightId));
  if (left !== right) return left < right ? -1 : 1;
  return leftId.localeCompare(rightId);
}
