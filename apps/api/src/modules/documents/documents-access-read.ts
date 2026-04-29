import { PrismaClient, type Prisma } from '@nbos/database';
import type { DocumentListScopeEnum } from '@nbos/database';

/** RBAC `DOCUMENTS_VIEW` scope from JWT (uppercase). */
export type DocumentsRbacViewScope = 'ALL' | 'OWN' | 'DEPARTMENT' | 'NONE';

export interface DocumentsReadAccess {
  employeeId: string;
  departmentIds: string[];
  /** `user.permissions.DOCUMENTS_VIEW` (RBAC list/read scope). */
  documentsViewScope: string | undefined;
}

export function normalizeDocumentsViewScope(raw: string | undefined): DocumentsRbacViewScope {
  const s = raw?.trim().toUpperCase();
  if (s === 'ALL' || s === 'OWN' || s === 'DEPARTMENT' || s === 'NONE') return s;
  return 'NONE';
}

export async function loadColleagueEmployeeIds(
  prisma: InstanceType<typeof PrismaClient>,
  departmentIds: string[],
): Promise<string[]> {
  if (departmentIds.length === 0) return [];
  const rows = await prisma.employeeDepartment.findMany({
    where: { departmentId: { in: departmentIds } },
    select: { employeeId: true },
    distinct: ['employeeId'],
  });
  return rows.map((r) => r.employeeId);
}

function selfOrColleagueOwnerWhere(
  employeeId: string,
  colleagueIds: string[],
): Prisma.DocumentWhereInput {
  const ors: Prisma.DocumentWhereInput[] = [{ ownerId: employeeId }, { createdById: employeeId }];
  if (colleagueIds.length > 0) {
    ors.push({ ownerId: { in: colleagueIds } }, { createdById: { in: colleagueIds } });
  }
  return { OR: ors };
}

function rbacReadableWhere(
  viewScope: DocumentsRbacViewScope,
  employeeId: string,
  colleagueIds: string[],
) {
  switch (viewScope) {
    case 'ALL':
      return {} satisfies Prisma.DocumentWhereInput;
    case 'OWN':
      return {
        OR: [{ ownerId: employeeId }, { createdById: employeeId }],
      } satisfies Prisma.DocumentWhereInput;
    case 'DEPARTMENT':
      return selfOrColleagueOwnerWhere(employeeId, colleagueIds);
    default:
      return { id: { in: [] } } satisfies Prisma.DocumentWhereInput;
  }
}

function effectiveAllWhere(): Prisma.DocumentWhereInput {
  return {
    OR: [
      { listScopeOverride: 'ALL' },
      { AND: [{ listScopeOverride: null }, { section: { defaultListScope: 'ALL' } }] },
    ],
  };
}

function effectiveOwnWhere(employeeId: string): Prisma.DocumentWhereInput {
  return {
    AND: [
      {
        OR: [
          { listScopeOverride: 'OWN' },
          { AND: [{ listScopeOverride: null }, { section: { defaultListScope: 'OWN' } }] },
        ],
      },
      { OR: [{ ownerId: employeeId }, { createdById: employeeId }] },
    ],
  };
}

function effectiveDepartmentWhere(
  employeeId: string,
  colleagueIds: string[],
): Prisma.DocumentWhereInput {
  return {
    AND: [
      {
        OR: [
          { listScopeOverride: 'DEPARTMENT' },
          { AND: [{ listScopeOverride: null }, { section: { defaultListScope: 'DEPARTMENT' } }] },
        ],
      },
      selfOrColleagueOwnerWhere(employeeId, colleagueIds),
    ],
  };
}

/** AND-layer: RBAC view scope × (section default ∪ document override) list rules. */
export function buildDocumentsReadableWhere(
  viewScope: DocumentsRbacViewScope,
  employeeId: string,
  colleagueIds: string[],
): Prisma.DocumentWhereInput {
  if (viewScope === 'NONE') {
    return { id: { in: [] } };
  }
  return {
    AND: [
      rbacReadableWhere(viewScope, employeeId, colleagueIds),
      {
        OR: [
          effectiveAllWhere(),
          effectiveOwnWhere(employeeId),
          effectiveDepartmentWhere(employeeId, colleagueIds),
        ],
      },
    ],
  };
}

export type ResolvedDocumentsRead =
  | { denied: true }
  | {
      denied: false;
      viewScope: Exclude<DocumentsRbacViewScope, 'NONE'>;
      colleagueIds: string[];
    };

export async function resolveDocumentsReadContext(
  prisma: InstanceType<typeof PrismaClient>,
  access: DocumentsReadAccess,
): Promise<ResolvedDocumentsRead> {
  const viewScope = normalizeDocumentsViewScope(access.documentsViewScope);
  if (viewScope === 'NONE') return { denied: true };
  const colleagueIds = await loadColleagueEmployeeIds(prisma, access.departmentIds);
  return {
    denied: false,
    viewScope: viewScope as Exclude<DocumentsRbacViewScope, 'NONE'>,
    colleagueIds,
  };
}

export interface DocumentReadRow {
  ownerId: string | null;
  createdById: string | null;
  listScopeOverride: DocumentListScopeEnum | null;
  section: { defaultListScope: DocumentListScopeEnum };
}

function isActorOnDocument(doc: DocumentReadRow, actorId: string): boolean {
  return doc.ownerId === actorId || doc.createdById === actorId;
}

function isActorOrColleagueOnDocument(
  doc: DocumentReadRow,
  actorId: string,
  colleagueIds: string[],
): boolean {
  if (isActorOnDocument(doc, actorId)) return true;
  const ownerOk = doc.ownerId !== null && colleagueIds.includes(doc.ownerId);
  const createdOk = doc.createdById !== null && colleagueIds.includes(doc.createdById);
  return ownerOk || createdOk;
}

function rbacAllowsRead(
  viewScope: DocumentsRbacViewScope,
  doc: DocumentReadRow,
  actorId: string,
  colleagueIds: string[],
): boolean {
  switch (viewScope) {
    case 'ALL':
      return true;
    case 'OWN':
      return isActorOnDocument(doc, actorId);
    case 'DEPARTMENT':
      return isActorOrColleagueOnDocument(doc, actorId, colleagueIds);
    default:
      return false;
  }
}

function effectiveListScopeAllowsRead(
  effective: DocumentListScopeEnum,
  doc: DocumentReadRow,
  actorId: string,
  colleagueIds: string[],
): boolean {
  switch (effective) {
    case 'ALL':
      return true;
    case 'OWN':
      return isActorOnDocument(doc, actorId);
    case 'DEPARTMENT':
      return isActorOrColleagueOnDocument(doc, actorId, colleagueIds);
    default:
      return false;
  }
}

/** Mirrors `buildDocumentsReadableWhere` for a loaded document row (detail 404). */
export function employeeCanReadDocumentRow(
  doc: DocumentReadRow,
  viewScope: DocumentsRbacViewScope,
  employeeId: string,
  colleagueIds: string[],
): boolean {
  if (viewScope === 'NONE') return false;
  const effective = doc.listScopeOverride ?? doc.section.defaultListScope;
  return (
    rbacAllowsRead(viewScope, doc, employeeId, colleagueIds) &&
    effectiveListScopeAllowsRead(effective, doc, employeeId, colleagueIds)
  );
}
