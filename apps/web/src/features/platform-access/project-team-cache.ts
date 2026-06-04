import { platformAccessApi, type ProjectTeamMemberRow } from '@/lib/api/platform-access';
import { PROJECT_TEAM_CACHE_TTL_MS } from './constants';

type ProjectTeamCacheEntry = {
  members: ProjectTeamMemberRow[];
  fetchedAt: number;
};

const projectTeamCache = new Map<string, ProjectTeamCacheEntry>();
const projectTeamPromise = new Map<string, Promise<ProjectTeamCacheEntry>>();

function isFresh(fetchedAt: number): boolean {
  return Date.now() - fetchedAt < PROJECT_TEAM_CACHE_TTL_MS;
}

async function fetchProjectTeam(projectId: string): Promise<ProjectTeamCacheEntry> {
  const res = await platformAccessApi.listProjectTeam(projectId);
  const members = Array.isArray(res.data) ? res.data : [];
  return { members, fetchedAt: Date.now() };
}

export function readProjectTeamCache(projectId: string): ProjectTeamMemberRow[] | null {
  const entry = projectTeamCache.get(projectId);
  if (!entry || !isFresh(entry.fetchedAt)) {
    return null;
  }
  return entry.members;
}

export function invalidateProjectTeamCache(projectId?: string): void {
  if (projectId) {
    projectTeamCache.delete(projectId);
    projectTeamPromise.delete(projectId);
    return;
  }
  projectTeamCache.clear();
  projectTeamPromise.clear();
}

export async function loadProjectTeam(projectId: string): Promise<ProjectTeamMemberRow[]> {
  const cached = projectTeamCache.get(projectId);
  if (cached && isFresh(cached.fetchedAt)) {
    return cached.members;
  }

  const inFlight = projectTeamPromise.get(projectId);
  if (inFlight) {
    return (await inFlight).members;
  }

  const promise = fetchProjectTeam(projectId)
    .then((entry) => {
      projectTeamCache.set(projectId, entry);
      return entry;
    })
    .finally(() => {
      projectTeamPromise.delete(projectId);
    });

  projectTeamPromise.set(projectId, promise);
  return (await promise).members;
}

/** Start team fetch in parallel with project detail — deduped via {@link loadProjectTeam}. */
export function prefetchProjectTeam(projectId: string): void {
  void loadProjectTeam(projectId);
}
