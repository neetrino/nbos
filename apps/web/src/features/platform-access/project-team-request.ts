import { platformAccessApi, type ProjectTeamMemberRow } from '@/lib/api/platform-access';

const inFlight = new Map<string, Promise<ProjectTeamMemberRow[]>>();

async function fetchProjectTeam(projectId: string): Promise<ProjectTeamMemberRow[]> {
  const res = await platformAccessApi.listProjectTeam(projectId);
  return Array.isArray(res.data) ? res.data : [];
}

/** Loads project team; dedupes concurrent requests for the same project. */
export async function loadProjectTeam(projectId: string): Promise<ProjectTeamMemberRow[]> {
  const existing = inFlight.get(projectId);
  if (existing) {
    return existing;
  }

  const promise = fetchProjectTeam(projectId).finally(() => {
    inFlight.delete(projectId);
  });
  inFlight.set(projectId, promise);
  return promise;
}

/** Start team fetch in parallel with project detail. */
export function prefetchProjectTeam(projectId: string): void {
  void loadProjectTeam(projectId);
}
