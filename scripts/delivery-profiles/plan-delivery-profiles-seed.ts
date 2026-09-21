import {
  buildProfileSeedVersions,
  referencedFunctionCodes,
  type ProfileSeedVersion,
} from './delivery-profiles-seed-data';

/** What the database already holds for a profile key the seed owns. */
export type ExistingProfile = {
  profileKey: string;
  status: string;
  configurationCount: number;
};

export type ProfilePlanEntry =
  | { action: 'CREATE'; version: ProfileSeedVersion }
  | { action: 'REPLACE'; version: ProfileSeedVersion }
  | { action: 'KEEP'; version: ProfileSeedVersion; reason: string };

export type ProfileSeedPlan = {
  entries: ProfilePlanEntry[];
  createCount: number;
  replaceCount: number;
  keepCount: number;
  /** Catalog codes a profile references but the database does not have. */
  missingFunctionCodes: string[];
};

const KEPT_BY_DEFAULT = 'already present';
const KEPT_PUBLISHED = 'not a draft';
const KEPT_IN_USE = 'a configuration froze it';

/**
 * Decides what the seed would write. By default an existing profile key is never touched, because
 * the Owner may have corrected its units or published it and a re-run must not undo that.
 *
 * `replaceDrafts` is for correcting seeded content that is still a proposal. It only applies to a
 * key that is still `DRAFT` and that no configuration has frozen; anything else stays `KEEP`, so
 * the flag cannot reach a published norm or a plan somebody is already being paid against.
 */
export function planDeliveryProfilesSeed(
  existing: readonly ExistingProfile[],
  existingFunctionCodes: readonly string[],
  options: { replaceDrafts?: boolean } = {},
  versions: readonly ProfileSeedVersion[] = buildProfileSeedVersions(),
): ProfileSeedPlan {
  const known = new Map(existing.map((row) => [row.profileKey, row]));
  const catalog = new Set(existingFunctionCodes);
  const entries = versions.map<ProfilePlanEntry>((version) => {
    const row = known.get(version.profileKey);
    if (!row) return { action: 'CREATE', version };
    if (!options.replaceDrafts) return { action: 'KEEP', version, reason: KEPT_BY_DEFAULT };
    return planExisting(version, row);
  });
  return {
    entries,
    createCount: countOf(entries, 'CREATE'),
    replaceCount: countOf(entries, 'REPLACE'),
    keepCount: countOf(entries, 'KEEP'),
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
  const counts = `${plan.createCount} to create, ${plan.replaceCount} to replace, ${plan.keepCount} kept`;
  const header = apply
    ? `Applying delivery profile seed: ${counts}.`
    : `Dry run. ${counts}. Nothing is written.`;
  return [header, ...plan.entries.map(formatEntry), ...formatMissing(plan)].join('\n');
}

function formatEntry(entry: ProfilePlanEntry): string {
  const shape = `core ${entry.version.kind.coreItems.length} items, preset ${entry.version.presetFunctionCodes.length} modules`;
  if (entry.action === 'KEEP') return `  KEEP    ${entry.version.profileKey} — ${entry.reason}`;
  const verb = entry.action === 'CREATE' ? 'CREATE ' : 'REPLACE';
  return `  ${verb} ${entry.version.profileKey} (${shape})`;
}

function formatMissing(plan: ProfileSeedPlan): string[] {
  if (plan.missingFunctionCodes.length === 0) return [];
  return [`Missing catalog codes: ${plan.missingFunctionCodes.join(', ')}`];
}
