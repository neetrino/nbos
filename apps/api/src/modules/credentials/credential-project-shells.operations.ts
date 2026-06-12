import type { Prisma } from '@nbos/database';
import { resolveCredentialsRbacScope, type CredentialsAccessContext } from './credentials-access';
import { buildCredentialListWhere } from './credential-list-where';
import type { CredentialsRuntime } from './credentials-runtime';

export interface CredentialProjectShellRow {
  id: string;
  name: string;
  code: string;
  credentialCount: number;
}

/** Virtual project folders: visible PROJECT_TEAM credentials grouped by project. */
export async function listCredentialProjectShells(
  runtime: CredentialsRuntime,
  access: CredentialsAccessContext,
): Promise<{ shells: CredentialProjectShellRow[] }> {
  const baseWhere = await buildCredentialListWhere(runtime, {
    tab: 'project',
    employeeId: access.employeeId,
    departmentIds: access.departmentIds,
    viewScope: resolveCredentialsRbacScope(access, 'view'),
  });

  const where: Prisma.CredentialWhereInput = {
    AND: [baseWhere, { projectId: { not: null } }],
  };

  const groups = await runtime.prisma.credential.groupBy({
    by: ['projectId'],
    where,
    _count: { _all: true },
  });

  const projectIds = groups
    .map((group) => group.projectId)
    .filter((id): id is string => typeof id === 'string');

  if (projectIds.length === 0) return { shells: [] };

  const projects = await runtime.prisma.project.findMany({
    where: { id: { in: projectIds }, trashedAt: null },
    select: { id: true, name: true, code: true },
  });

  const countByProjectId = new Map(groups.map((group) => [group.projectId, group._count._all]));

  const shells = projects
    .map((project) => ({
      id: project.id,
      name: project.name,
      code: project.code,
      credentialCount: countByProjectId.get(project.id) ?? 0,
    }))
    .filter((shell) => shell.credentialCount > 0)
    .sort((a, b) => a.name.localeCompare(b.name));

  return { shells };
}
