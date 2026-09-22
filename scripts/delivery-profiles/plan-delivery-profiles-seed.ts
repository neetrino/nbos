import {
  buildProfileSeedVersions,
  referencedFunctionCodes,
  retiredSizedProfileKeys,
  type ProfileSeedVersion,
} from './delivery-profiles-seed-data';

export type ExistingProfile = {
  profileKey: string;
  status: string;
  configurationCount: number;
};

export type ProfilePlanEntry =
  | { action: 'CREATE'; version: ProfileSeedVersion }
  | { action: 'REPLACE'; version: ProfileSeedVersion }
  | { action: 'UPDATE_COPY'; version: ProfileSeedVersion }
  | { action: 'KEEP'; version: ProfileSeedVersion; reason: string };

export type RetiredPlanEntry =
  | { action: 'RETIRE'; profileKey: string }
  | { action: 'KEEP_RETIRED'; profileKey: string; reason: string };

export type ProfileSeedPlan = {
  entries: ProfilePlanEntry[];
  retired: RetiredPlanEntry[];
  createCount: number;
  replaceCount: number;
  updateCopyCount: number;
  keepCount: number;
  retireCount: number;
  missingFunctionCodes: string[];
};

const KEPT_BY_DEFAULT = 'already present';
const KEPT_PUBLISHED = 'not a draft';
const KEPT_IN_USE = 'a configuration froze it';

export function planDeliveryProfilesSeed(
  existing: readonly ExistingProfile[],
  existingFunctionCodes: readonly string[],
  options: { replaceDrafts?: boolean; updateCopy?: boolean } = {},
  versions: readonly ProfileSeedVersion[] = buildProfileSeedVersions(),
): ProfileSeedPlan {
  const known = new Map(existing.map((row) => [row.profileKey, row]));
  const catalog = new Set(existingFunctionCodes);
  const entries = versions.map<ProfilePlanEntry>((version) => {
    const row = known.get(version.profileKey);
    if (!row) return { action: 'CREATE', version };
    if (options.updateCopy) return { action: 'UPDATE_COPY', version };
    if (!options.replaceDrafts) return { action: 'KEEP', version, reason: KEPT_BY_DEFAULT };
    return planExisting(version, row);
  });
  const retired = retiredSizedProfileKeys().map<RetiredPlanEntry>((profileKey) => {
    const row = known.get(profileKey);
    if (!row) return { action: 'KEEP_RETIRED', profileKey, reason: 'absent' };
    if (row.status !== 'DRAFT' || row.configurationCount > 0) {
      return { action: 'KEEP_RETIRED', profileKey, reason: KEPT_IN_USE };
    }
    return { action: 'RETIRE', profileKey };
  });
  return {
    entries,
    retired,
    createCount: countOf(entries, 'CREATE'),
    replaceCount: countOf(entries, 'REPLACE'),
    updateCopyCount: countOf(entries, 'UPDATE_COPY'),
    keepCount: countOf(entries, 'KEEP'),
    retireCount: retired.filter((row) => row.action === 'RETIRE').length,
    missingFunctionCodes: referencedFunctionCodes().filter((code) => !catalog.has(code)),
  };
}

function planExisting(version: ProfileSeedVersion, row: ExistingProfile): ProfilePlanEntry {
  if (row.status !== 'DRAFT') return { action: 'KEEP', version, reason: KEPT_PUBLISHED };
  if (row.configurationCount > 0) return { action: 'KEEP', version, reason: KEPT_IN_USE };
  return { action: 'REPLACE', version };
}

function countOf(entries: readonly ProfilePlanEntry[], action: ProfilePlanEntry['action']): number {
  return entries.filter((entry) => entry.action === action).length;
}

export function formatProfileSeedPlan(plan: ProfileSeedPlan, apply: boolean): string {
  const counts = `${plan.createCount} to create, ${plan.replaceCount} to replace, ${plan.updateCopyCount} copy updates, ${plan.keepCount} kept, ${plan.retireCount} sized drafts to drop`;
  const header = apply
    ? `Applying delivery profile seed: ${counts}.`
    : `Dry run. ${counts}. Nothing is written.`;
  return [
    header,
    ...plan.entries.map(formatEntry),
    ...plan.retired
      .filter((row) => row.action === 'RETIRE')
      .map((row) => `  RETIRE  ${row.profileKey}`),
    ...formatMissing(plan),
  ].join('\n');
}

function formatEntry(entry: ProfilePlanEntry): string {
  const shape = `core ${entry.version.kind.coreItems.length} items`;
  if (entry.action === 'KEEP') return `  KEEP    ${entry.version.profileKey} — ${entry.reason}`;
  const verb =
    entry.action === 'CREATE'
      ? 'CREATE '
      : entry.action === 'UPDATE_COPY'
        ? 'UPDATE_COPY'
        : 'REPLACE';
  return `  ${verb} ${entry.version.profileKey} (${shape})`;
}

function formatMissing(plan: ProfileSeedPlan): string[] {
  if (plan.missingFunctionCodes.length === 0) return [];
  return [`Missing catalog codes: ${plan.missingFunctionCodes.join(', ')}`];
}
