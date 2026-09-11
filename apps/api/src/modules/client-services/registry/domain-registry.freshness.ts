import { REGISTRY_SNAPSHOT_TTL_HOURS } from './domain-registry.constants';

const HOUR_MS = 60 * 60 * 1000;

export function isRegistrySnapshotFresh(
  checkedAt: Date | null | undefined,
  now: Date = new Date(),
  ttlHours: number = REGISTRY_SNAPSHOT_TTL_HOURS,
): boolean {
  if (!checkedAt) return false;
  return now.getTime() - checkedAt.getTime() < ttlHours * HOUR_MS;
}
