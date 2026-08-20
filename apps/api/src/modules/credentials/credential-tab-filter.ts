import type { Prisma } from '@nbos/database';
import type { CredentialTab } from './credential-tab';
import { credentialsRbacBypassesRowFilter } from './credentials-access';
import {
  buildCredentialVisibilityOr,
  type CredentialVisibilityContext,
} from './credentials-visibility';

/** Tab-based filtering: only credentials matching the selected vault tab. */
export function applyCredentialTabFilter(
  where: Prisma.CredentialWhereInput,
  tab: CredentialTab,
  employeeId: string,
  visibilityCtx: CredentialVisibilityContext | undefined,
  bypassRowVisibility?: boolean,
): void {
  const rbacBypass = credentialsRbacBypassesRowFilter(bypassRowVisibility);
  const searchOr = where.OR;
  delete where.OR;
  delete where.accessLevel;
  delete where.ownerId;
  delete where.departmentId;

  const andParts: Prisma.CredentialWhereInput[] = [];
  if (searchOr) andParts.push({ OR: searchOr });
  andParts.push(tabWhere(tab, employeeId, visibilityCtx, rbacBypass));

  if (andParts.length === 1) Object.assign(where, andParts[0]);
  else where.AND = andParts;
}

function tabWhere(
  tab: CredentialTab,
  employeeId: string,
  ctx: CredentialVisibilityContext | undefined,
  bypass: boolean,
): Prisma.CredentialWhereInput {
  if (tab === 'personal') {
    return { accessLevel: 'PERSONAL', ownerId: employeeId };
  }
  if (bypass) return bypassTabWhere(tab);
  if (!ctx) return { id: { in: [] } };
  if (tab === 'all') return { OR: buildCredentialVisibilityOr(ctx) };
  return scopedTabWhere(tab, ctx);
}

function bypassTabWhere(tab: CredentialTab): Prisma.CredentialWhereInput {
  if (tab === 'department') return { accessLevel: 'DEPARTMENT' };
  if (tab === 'secret') return { accessLevel: 'SECRET' };
  if (tab === 'project') return { accessLevel: 'PROJECT_TEAM' };
  if (tab === 'company') return { accessLevel: 'ALL' };
  return {};
}

function scopedTabWhere(
  tab: CredentialTab,
  ctx: CredentialVisibilityContext,
): Prisma.CredentialWhereInput {
  const branches = buildCredentialVisibilityOr(ctx);
  if (tab === 'department') return firstMatching(branches, 'DEPARTMENT') ?? { id: { in: [] } };
  if (tab === 'project') return firstMatching(branches, 'PROJECT_TEAM') ?? { id: { in: [] } };
  if (tab === 'company') return firstMatching(branches, 'ALL') ?? { id: { in: [] } };
  if (tab === 'secret') return grantAndSecretWhere(ctx);
  return { OR: branches };
}

function firstMatching(
  branches: Prisma.CredentialWhereInput[],
  accessLevel: string,
): Prisma.CredentialWhereInput | undefined {
  return branches.find((branch) => branchContainsAccessLevel(branch, accessLevel));
}

function branchContainsAccessLevel(
  branch: Prisma.CredentialWhereInput,
  accessLevel: string,
): boolean {
  if (branch.accessLevel === accessLevel) return true;
  const andParts = branch.AND;
  if (!Array.isArray(andParts)) return false;
  return andParts.some(
    (part) =>
      typeof part === 'object' &&
      part !== null &&
      'accessLevel' in part &&
      part.accessLevel === accessLevel,
  );
}

function grantAndSecretWhere(ctx: CredentialVisibilityContext): Prisma.CredentialWhereInput {
  const granted: Prisma.CredentialWhereInput[] = [{ allowedEmployees: { has: ctx.employeeId } }];
  if (ctx.manualGrantCredentialIds.length > 0) {
    granted.push({ id: { in: ctx.manualGrantCredentialIds } });
  }
  return {
    AND: [{ accessLevel: 'SECRET' }, { confidentiality: { not: 'OWNER_ONLY' } }, { OR: granted }],
  };
}
