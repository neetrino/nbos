import { TEAM_PAGE_SIZE } from '@/features/hr/constants/team-directory';
import {
  departmentsApi,
  employeesApi,
  rolesApi,
  type DepartmentItem,
  type Employee,
  type RoleItem,
} from '@/lib/api/employees';
import {
  TEAM_DIRECTORY_CACHE_TTL_MS,
  TEAM_FILTER_META_CACHE_TTL_MS,
} from './employee-directory-constants';

export type TeamListQuery = {
  search?: string;
  roleId?: string;
  level?: string;
  status?: string;
  departmentId?: string;
};

type TeamListCacheEntry = {
  items: Employee[];
  total: number;
  fetchedAt: number;
};

type TeamFilterMetaCache = {
  roles: RoleItem[];
  departments: DepartmentItem[];
  fetchedAt: number;
};

const teamListCache = new Map<string, TeamListCacheEntry>();
const teamListPromise = new Map<string, Promise<TeamListCacheEntry>>();
let filterMetaCache: TeamFilterMetaCache | null = null;
let filterMetaPromise: Promise<TeamFilterMetaCache> | null = null;

function teamListCacheKey(query: TeamListQuery): string {
  return JSON.stringify({
    search: query.search?.trim() || undefined,
    roleId: query.roleId,
    level: query.level,
    status: query.status,
    departmentId: query.departmentId,
  });
}

function isFresh(fetchedAt: number, ttlMs: number): boolean {
  return Date.now() - fetchedAt < ttlMs;
}

async function fetchTeamList(query: TeamListQuery): Promise<TeamListCacheEntry> {
  const { items, meta } = await employeesApi.getAll({
    pageSize: TEAM_PAGE_SIZE,
    search: query.search,
    roleId: query.roleId,
    level: query.level,
    status: query.status,
    departmentId: query.departmentId,
  });
  return { items, total: meta.total, fetchedAt: Date.now() };
}

export function readTeamListCache(query: TeamListQuery): TeamListCacheEntry | null {
  const entry = teamListCache.get(teamListCacheKey(query));
  if (!entry || !isFresh(entry.fetchedAt, TEAM_DIRECTORY_CACHE_TTL_MS)) {
    return null;
  }
  return entry;
}

export function writeTeamListCache(query: TeamListQuery, entry: TeamListCacheEntry): void {
  teamListCache.set(teamListCacheKey(query), entry);
}

export function invalidateTeamDirectoryCache(): void {
  teamListCache.clear();
  teamListPromise.clear();
  filterMetaCache = null;
  filterMetaPromise = null;
}

export async function loadTeamList(query: TeamListQuery): Promise<TeamListCacheEntry> {
  const key = teamListCacheKey(query);
  const cached = teamListCache.get(key);
  if (cached && isFresh(cached.fetchedAt, TEAM_DIRECTORY_CACHE_TTL_MS)) {
    return cached;
  }

  const inFlight = teamListPromise.get(key);
  if (inFlight) {
    return inFlight;
  }

  const promise = fetchTeamList(query)
    .then((entry) => {
      teamListCache.set(key, entry);
      return entry;
    })
    .finally(() => {
      teamListPromise.delete(key);
    });

  teamListPromise.set(key, promise);
  return promise;
}

export async function loadTeamFilterMeta(): Promise<TeamFilterMetaCache> {
  if (filterMetaCache && isFresh(filterMetaCache.fetchedAt, TEAM_FILTER_META_CACHE_TTL_MS)) {
    return filterMetaCache;
  }
  if (filterMetaPromise) {
    return filterMetaPromise;
  }

  filterMetaPromise = Promise.all([rolesApi.getAll(), departmentsApi.getAll()])
    .then(([roles, departments]) => {
      filterMetaCache = {
        roles: roles ?? [],
        departments: departments ?? [],
        fetchedAt: Date.now(),
      };
      return filterMetaCache;
    })
    .finally(() => {
      filterMetaPromise = null;
    });

  return filterMetaPromise;
}

/** Warm default team directory (no filters) after sign-in. Best-effort — never throws. */
export function prefetchTeamDirectoryDefaultPage(): void {
  void loadTeamList({}).catch(() => undefined);
  void loadTeamFilterMeta().catch(() => undefined);
}
