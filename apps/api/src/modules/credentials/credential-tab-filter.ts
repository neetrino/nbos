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
  viewScope?: string,
): void {
  const rbacBypass = credentialsRbacBypassesRowFilter(viewScope);
  const searchOr = where.OR;
  delete where.OR;
  delete where.accessLevel;
  delete where.ownerId;
  delete where.departmentId;

  const andParts: Prisma.CredentialWhereInput[] = [];
  if (searchOr) andParts.push({ OR: searchOr });

  switch (tab) {
    case 'personal':
      andParts.push({ accessLevel: 'PERSONAL', ownerId: employeeId });
      break;
    case 'department': {
      const deptBranch = visibilityCtx
        ? buildCredentialVisibilityOr(visibilityCtx).find(
            (b) => 'accessLevel' in b && b.accessLevel === 'DEPARTMENT',
          )
        : undefined;
      if (!rbacBypass && deptBranch) andParts.push(deptBranch);
      else {
        andParts.push({ accessLevel: 'DEPARTMENT' });
        if (visibilityCtx && visibilityCtx.departmentIds.length > 0) {
          andParts.push({ departmentId: { in: visibilityCtx.departmentIds } });
        }
      }
      break;
    }
    case 'secret': {
      const secretBranch = visibilityCtx
        ? buildCredentialVisibilityOr(visibilityCtx).find(
            (b) => 'accessLevel' in b && b.accessLevel === 'SECRET',
          )
        : undefined;
      if (!rbacBypass && secretBranch) andParts.push(secretBranch);
      else andParts.push({ accessLevel: 'SECRET' });
      break;
    }
    case 'project': {
      const projectBranch = visibilityCtx
        ? buildCredentialVisibilityOr(visibilityCtx).find(
            (b) => 'accessLevel' in b && b.accessLevel === 'PROJECT_TEAM',
          )
        : undefined;
      if (!rbacBypass && projectBranch) andParts.push(projectBranch);
      else andParts.push({ accessLevel: 'PROJECT_TEAM' });
      break;
    }
    case 'all':
    default:
      if (!rbacBypass && visibilityCtx) {
        andParts.push({ OR: buildCredentialVisibilityOr(visibilityCtx) });
      }
      break;
  }

  if (andParts.length === 1) Object.assign(where, andParts[0]);
  else if (andParts.length > 1) where.AND = andParts;
}
