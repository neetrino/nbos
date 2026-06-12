import { PLATFORM_TRASH_INVENTORY_ENTRIES } from './platform-trash-inventory.registry';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const ENV_DEFAULT_KEY = 'PLATFORM_TRASH_RETENTION_DAYS_DEFAULT';
const ENV_ENTITY_PREFIX = 'PLATFORM_TRASH_RETENTION_DAYS_';

function entityKeyToEnvSuffix(entityKey: string): string {
  return entityKey.replace(/[^a-z0-9]+/gi, '_').toUpperCase();
}

function parsePositiveDays(raw: string | undefined): number | null {
  if (raw == null || raw.trim() === '') return null;
  const parsed = Number.parseInt(raw.trim(), 10);
  if (!Number.isFinite(parsed) || parsed < 1) return null;
  return parsed;
}

function readEnvValue(key: string, env: NodeJS.ProcessEnv): string | undefined {
  return env[key];
}

/**
 * Resolves effective trash retention days for an inventory entity key.
 * Precedence: per-entity env → global default env → registry default.
 */
export function resolveRetentionDaysForEntity(
  entityKey: string,
  registryDefault: number | null,
  env: NodeJS.ProcessEnv = process.env,
): number | null {
  if (registryDefault == null) return null;

  const perEntity = parsePositiveDays(
    readEnvValue(`${ENV_ENTITY_PREFIX}${entityKeyToEnvSuffix(entityKey)}`, env),
  );
  if (perEntity != null) return perEntity;

  const globalDefault = parsePositiveDays(readEnvValue(ENV_DEFAULT_KEY, env));
  if (globalDefault != null) return globalDefault;

  return registryDefault;
}

export function resolveRetentionMsForEntity(
  entityKey: string,
  env: NodeJS.ProcessEnv = process.env,
): number | null {
  const entry = PLATFORM_TRASH_INVENTORY_ENTRIES.find((row) => row.key === entityKey);
  const days = resolveRetentionDaysForEntity(entityKey, entry?.retentionDays ?? null, env);
  if (days == null) return null;
  return days * MS_PER_DAY;
}

export function listResolvedRetentionRules(env: NodeJS.ProcessEnv = process.env) {
  return PLATFORM_TRASH_INVENTORY_ENTRIES.map((entry) => ({
    key: entry.key,
    moduleLabel: entry.moduleLabel,
    entityLabel: entry.entityLabel,
    profile: entry.profile,
    timestampField: entry.timestampField,
    registryRetentionDays: entry.retentionDays,
    retentionDays: resolveRetentionDaysForEntity(entry.key, entry.retentionDays, env),
    scheduledPurgeJob: entry.scheduledPurgeJob,
    automatedPurge: entry.scheduledPurgeJob != null,
  }));
}
