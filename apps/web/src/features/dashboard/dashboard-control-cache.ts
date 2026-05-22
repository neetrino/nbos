import type {
  DashboardData,
  DashboardNote,
  DashboardPersonalLink,
  DashboardPreference,
  PriorityCard,
} from './dashboard-control-registry';

export const DASHBOARD_CONTROL_CACHE_VERSION = 1;
export const DASHBOARD_CONTROL_CACHE_STORAGE_KEY = 'nbos:dashboard:control-center';

export type DashboardControlCacheSnapshot = {
  metrics: DashboardData;
  priorities: PriorityCard[];
  preference: DashboardPreference;
  personalLinks: DashboardPersonalLink[];
  notes: DashboardNote[];
};

type DashboardControlCacheEnvelope = DashboardControlCacheSnapshot & {
  version: number;
  userId: string;
  savedAt: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object';
}

function isDashboardNote(value: unknown): value is DashboardNote {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.content === 'string' &&
    typeof value.sortOrder === 'number' &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string'
  );
}

function isDashboardPreference(value: unknown): value is DashboardPreference {
  if (!isRecord(value)) return false;
  return (
    Array.isArray(value.pinnedActionOrder) &&
    Array.isArray(value.hiddenPinnedActions) &&
    Array.isArray(value.visibleWidgets) &&
    Array.isArray(value.hiddenWidgets)
  );
}

function parseEnvelope(raw: string, userId: string): DashboardControlCacheSnapshot | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return null;
    if (parsed.version !== DASHBOARD_CONTROL_CACHE_VERSION) return null;
    if (parsed.userId !== userId) return null;
    if (!isRecord(parsed.metrics)) return null;
    if (!isDashboardPreference(parsed.preference)) return null;
    if (!Array.isArray(parsed.priorities) || !Array.isArray(parsed.personalLinks)) return null;
    if (!Array.isArray(parsed.notes) || !parsed.notes.every(isDashboardNote)) return null;

    return {
      metrics: parsed.metrics as DashboardData,
      priorities: parsed.priorities as PriorityCard[],
      preference: parsed.preference,
      personalLinks: parsed.personalLinks as DashboardPersonalLink[],
      notes: parsed.notes,
    };
  } catch {
    return null;
  }
}

/** Read per-user dashboard snapshot from localStorage (client only). */
export function readDashboardControlCache(userId: string): DashboardControlCacheSnapshot | null {
  if (typeof window === 'undefined' || !userId) return null;
  const raw = window.localStorage.getItem(DASHBOARD_CONTROL_CACHE_STORAGE_KEY);
  if (!raw) return null;
  return parseEnvelope(raw, userId);
}

/** Persist full dashboard snapshot for the current user. */
export function writeDashboardControlCache(
  userId: string,
  snapshot: DashboardControlCacheSnapshot,
): void {
  if (typeof window === 'undefined' || !userId) return;
  const envelope: DashboardControlCacheEnvelope = {
    version: DASHBOARD_CONTROL_CACHE_VERSION,
    userId,
    savedAt: new Date().toISOString(),
    ...snapshot,
  };
  window.localStorage.setItem(DASHBOARD_CONTROL_CACHE_STORAGE_KEY, JSON.stringify(envelope));
}

/** Merge metrics/priorities into an existing cache entry after a lightweight refresh. */
export function mergeDashboardControlCacheMetrics(
  userId: string,
  metrics: DashboardData,
  priorities: PriorityCard[],
): void {
  const existing = readDashboardControlCache(userId);
  if (!existing) return;
  writeDashboardControlCache(userId, { ...existing, metrics, priorities });
}

/** Prepend a note created outside the dashboard page (e.g. header quick note). */
export function prependDashboardControlCacheNote(userId: string, note: DashboardNote): void {
  const existing = readDashboardControlCache(userId);
  if (!existing) return;
  if (existing.notes.some((entry) => entry.id === note.id)) return;
  writeDashboardControlCache(userId, {
    ...existing,
    notes: [note, ...existing.notes],
  });
}

export function clearDashboardControlCache(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(DASHBOARD_CONTROL_CACHE_STORAGE_KEY);
}
