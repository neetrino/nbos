import type { Prisma } from '@nbos/database';

type ProjectRelationFilter = Prisma.ProductWhereInput['project'];

/**
 * Cross-project lists (delivery board, global hub) must not surface rows for trashed projects.
 * When `projectId` is set, callers are scoped to a single project view and keep all rows.
 */
export function mergeActiveParentProjectScope<
  W extends Prisma.ProductWhereInput | Prisma.ExtensionWhereInput,
>(where: W, options: { projectId?: string }): W {
  if (options.projectId) return where;

  const project = where.project;
  if (project && typeof project === 'object' && 'is' in project && project.is) {
    return { ...where, project: { is: { ...project.is, trashedAt: null } } };
  }
  return { ...where, project: { trashedAt: null } };
}
